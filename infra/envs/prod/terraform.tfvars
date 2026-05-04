environment = "prod"
project     = "foosball-league"
subproject  = "api"

# Custom domain (Cloudflare). Leave empty to keep AWS-generated URLs.
# When set, requires CLOUDFLARE_API_TOKEN env var (Zone:DNS:Edit + Zone:Zone:Read).
domain_name        = "foosrank.app"
cloudflare_zone_id = "917f15e304f5dac1fc63baf969cdcc9a"
