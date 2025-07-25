# Diretório de origem (onde estão os arquivos a serem compactados)
$origem = "C:\Users\czl2\Workspace\Gitlab\deno-folha-horas"

# Diretório de destino (onde o backup será armazenado)
$destino = "C:\Users\czl2\OneDrive - PETROBRAS\Arquivamento\Backup"

# Gera timestamp no formato yyyy-MM-dd HH-mm
$dataHora = Get-Date -Format "yyyy-MM-dd HH-mm"

# Nome do arquivo zip
$nomeZip = "deno-folha-horas_$dataHora.zip"

# Caminho completo do arquivo zip temporário
$caminhoZipTemp = Join-Path -Path $env:TEMP -ChildPath $nomeZip

# Caminho final do arquivo zip
$caminhoZipFinal = Join-Path -Path $destino -ChildPath $nomeZip

# Cria o arquivo zip no diretório temporário
Compress-Archive -Path "$origem\*" -DestinationPath $caminhoZipTemp

# Move o arquivo zip para o diretório de backup
Move-Item -Path $caminhoZipTemp -Destination $caminhoZipFinal

Write-Host "Backup criado com sucesso em: $caminhoZipFinal"
