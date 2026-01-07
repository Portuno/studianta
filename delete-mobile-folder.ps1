# Script para eliminar la carpeta mobile
# Ejecuta este script DESPUÉS de cerrar Cursor/VS Code y el Explorador de Archivos

Write-Host "Intentando eliminar la carpeta mobile..." -ForegroundColor Yellow

$folder = "mobile"
$maxRetries = 5
$retryCount = 0

while ($retryCount -lt $maxRetries -and (Test-Path $folder)) {
    $retryCount++
    Write-Host "Intento $retryCount de $maxRetries..." -ForegroundColor Cyan
    
    try {
        # Intentar eliminar archivos individualmente primero
        if (Test-Path $folder) {
            Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | 
                ForEach-Object {
                    try {
                        Remove-Item $_.FullName -Force -Recurse -ErrorAction Stop
                    } catch {
                        # Ignorar errores individuales
                    }
                }
            
            # Esperar un momento
            Start-Sleep -Milliseconds 500
            
            # Intentar eliminar la carpeta
            Remove-Item -Path $folder -Force -Recurse -ErrorAction Stop
            Write-Host "¡Carpeta eliminada exitosamente!" -ForegroundColor Green
            break
        }
    } catch {
        if ($retryCount -lt $maxRetries) {
            Write-Host "Error en intento $retryCount : $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Esperando 2 segundos antes de reintentar..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        } else {
            Write-Host "`nNo se pudo eliminar la carpeta después de $maxRetries intentos." -ForegroundColor Red
            Write-Host "`nPor favor:" -ForegroundColor Yellow
            Write-Host "1. Cierra Cursor/VS Code completamente" -ForegroundColor White
            Write-Host "2. Cierra todas las ventanas del Explorador de Archivos que tengan la carpeta mobile abierta" -ForegroundColor White
            Write-Host "3. Cierra cualquier proceso de Node/Expo/Metro que pueda estar corriendo" -ForegroundColor White
            Write-Host "4. Ejecuta este script nuevamente" -ForegroundColor White
            Write-Host "`nO intenta eliminar la carpeta manualmente desde el Explorador de Archivos." -ForegroundColor Cyan
        }
    }
}

if (Test-Path $folder) {
    Write-Host "`nLa carpeta 'mobile' todavía existe." -ForegroundColor Red
} else {
    Write-Host "`nVerificando carpeta platform\mobile..." -ForegroundColor Cyan
    if (Test-Path "platform\mobile") {
        Remove-Item -Path "platform\mobile" -Force -Recurse -ErrorAction SilentlyContinue
        Write-Host "Carpeta platform\mobile eliminada." -ForegroundColor Green
    } else {
        Write-Host "La carpeta platform\mobile no existe (ya fue eliminada o nunca existió)." -ForegroundColor Green
    }
    Write-Host "`n¡Limpieza completada!" -ForegroundColor Green
}

