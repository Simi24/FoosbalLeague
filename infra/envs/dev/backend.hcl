bucket         = "foosball-league-terraform-state"
key            = "dev/terraform.tfstate"
region         = "eu-west-1"
encrypt        = true
dynamodb_table = "foosball-league-terraform-lock"
