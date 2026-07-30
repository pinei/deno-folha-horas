$env:NODE_EXTRA_CA_CERTS = "./ca.petrobras.goskope.crt"

# Use a named array so PowerShell forwards script arguments correctly to tsx.
$forwardedArgs = $args
npx tsx main.ts @forwardedArgs