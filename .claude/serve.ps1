param([string]$Root, [int]$Port = 5517, [string]$UploadDir = '')
# Tiny static server for local previews.
# - GET serves files under $Root (with Range support so videos can seek).
# - POST /__save?name=file.png writes the body into $UploadDir (only if set; plain file names only).
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
$types = @{'.html'='text/html; charset=utf-8';'.css'='text/css';'.js'='application/javascript';'.png'='image/png';'.jpg'='image/jpeg';'.webp'='image/webp';'.mp4'='video/mp4';'.pdf'='application/pdf'}
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $req = $c.Request; $res = $c.Response
    $p = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))

    if ($req.HttpMethod -eq 'POST' -and $p -eq '__save') {
      $name = $req.QueryString['name']
      if (-not $UploadDir -or -not $name -or $name -notmatch '^[\w.-]+$') { $res.StatusCode = 400 }
      else {
        $ms = New-Object System.IO.MemoryStream; $req.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes((Join-Path $UploadDir $name), $ms.ToArray())
        $res.StatusCode = 200
      }
      $res.Close(); continue
    }

    if ($p -eq '') { $p = 'index.html' }
    $f = Join-Path $Root $p
    if (-not (Test-Path $f -PathType Leaf)) { $res.StatusCode = 404; $res.Close(); continue }
    $e = [IO.Path]::GetExtension($f).ToLower()
    if ($types[$e]) { $res.ContentType = $types[$e] }
    $res.AddHeader('Accept-Ranges', 'bytes')
    $fs = [IO.File]::OpenRead($f)
    try {
      $len = $fs.Length; $start = 0; $end = $len - 1
      $range = $req.Headers['Range']
      if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
        if ($matches[1] -ne '') { $start = [int64]$matches[1] }
        if ($matches[2] -ne '') { $end = [math]::Min([int64]$matches[2], $len - 1) }
        elseif ($matches[1] -eq '') { $start = 0 }
        $res.StatusCode = 206
        $res.AddHeader('Content-Range', "bytes $start-$end/$len")
      }
      $count = $end - $start + 1
      $res.ContentLength64 = $count
      $fs.Seek($start, 'Begin') | Out-Null
      $buf = New-Object byte[] 65536; $left = $count
      while ($left -gt 0) {
        $n = $fs.Read($buf, 0, [int][math]::Min($buf.Length, $left)); if ($n -le 0) { break }
        $res.OutputStream.Write($buf, 0, $n); $left -= $n
      }
    } finally { $fs.Close() }
    $res.Close()
  } catch { try { $c.Response.Abort() } catch {} }
}
