# Quick Network Update Script
# This script helps you update the .env file with your current Wi-Fi IP address

# Get the current Wi-Fi IP address
try {
    $wifiIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -PrefixOrigin Dhcp).IPAddress
    Write-Host "Found Wi-Fi IP: $wifiIP" -ForegroundColor Green
    
    # Create the new API URL
    $newApiUrl = "EXPO_PUBLIC_API_URL=http://$wifiIP:4000/api"
    
    Write-Host "`nUpdate your .env file with:" -ForegroundColor Yellow
    Write-Host $newApiUrl -ForegroundColor Cyan
    
    # Ask if user wants to automatically update the .env file
    $response = Read-Host "`nDo you want to automatically update the .env file? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        # Read current .env file
        $envPath = ".\.env"
        if (Test-Path $envPath) {
            $envContent = Get-Content $envPath
            
            # Replace the API URL line
            $updatedContent = $envContent | ForEach-Object {
                if ($_ -match "^EXPO_PUBLIC_API_URL=") {
                    $newApiUrl
                } else {
                    $_
                }
            }
            
            # Write back to .env file
            $updatedContent | Set-Content $envPath -Encoding UTF8
            Write-Host "✓ .env file updated successfully!" -ForegroundColor Green
            Write-Host "You can now restart your Expo development server." -ForegroundColor Yellow
        } else {
            Write-Host "✗ .env file not found. Please create it manually." -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Could not detect Wi-Fi IP address automatically." -ForegroundColor Red
    Write-Host "Please run 'ipconfig' and manually update the .env file." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")