#!/bin/bash

export AWS_DEFAULT_REGION=eu-west-1

echo "============================================"
echo "  Foosball League - LocalStack Init"
echo "============================================"

# Create DynamoDB table with single-table design
awslocal dynamodb create-table \
    --table-name foosball-league \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
        AttributeName=gsi1_pk,AttributeType=S \
        AttributeName=gsi1_sk,AttributeType=S \
        AttributeName=gsi3_pk,AttributeType=S \
        AttributeName=gsi3_sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "gsi1_pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi1_sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "GSI3",
                "KeySchema": [
                    {"AttributeName": "gsi3_pk", "KeyType": "HASH"},
                    {"AttributeName": "gsi3_sk", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ]' \
    --billing-mode PAY_PER_REQUEST

echo "DynamoDB table 'foosball-league' created."

# Seed default tenant
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item '{
        "pk": {"S": "TENANT#default"},
        "sk": {"S": "METADATA"},
        "entity_type": {"S": "TENANT"},
        "tenant_id": {"S": "default"},
        "name": {"S": "Office Foosball"},
        "created_at": {"S": "2026-01-01T00:00:00Z"},
        "updated_at": {"S": "2026-01-01T00:00:00Z"}
    }'

echo "Default tenant seeded."

# --------------------------------------------------
# Seed Players
# --------------------------------------------------

TENANT="TENANT#default"
NOW="2026-03-01T12:00:00Z"

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"PLAYER#player-001\"},
        \"entity_type\": {\"S\": \"PLAYER\"},
        \"player_id\": {\"S\": \"player-001\"},
        \"cognito_sub\": {\"S\": \"local-dev-user-001\"},
        \"display_name\": {\"S\": \"Local Dev\"},
        \"email\": {\"S\": \"dev@foosball.local\"},
        \"total_matches\": {\"N\": \"6\"},
        \"total_wins\": {\"N\": \"4\"},
        \"total_losses\": {\"N\": \"2\"},
        \"gsi3_pk\": {\"S\": \"EMAIL#dev@foosball.local\"},
        \"gsi3_sk\": {\"S\": \"PLAYER#player-001\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"PLAYER#player-002\"},
        \"entity_type\": {\"S\": \"PLAYER\"},
        \"player_id\": {\"S\": \"player-002\"},
        \"cognito_sub\": {\"S\": \"cognito-sub-002\"},
        \"display_name\": {\"S\": \"Alice Spin\"},
        \"email\": {\"S\": \"alice@foosball.local\"},
        \"total_matches\": {\"N\": \"6\"},
        \"total_wins\": {\"N\": \"3\"},
        \"total_losses\": {\"N\": \"3\"},
        \"gsi3_pk\": {\"S\": \"EMAIL#alice@foosball.local\"},
        \"gsi3_sk\": {\"S\": \"PLAYER#player-002\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"PLAYER#player-003\"},
        \"entity_type\": {\"S\": \"PLAYER\"},
        \"player_id\": {\"S\": \"player-003\"},
        \"cognito_sub\": {\"S\": \"cognito-sub-003\"},
        \"display_name\": {\"S\": \"Bob Striker\"},
        \"email\": {\"S\": \"bob@foosball.local\"},
        \"total_matches\": {\"N\": \"4\"},
        \"total_wins\": {\"N\": \"1\"},
        \"total_losses\": {\"N\": \"3\"},
        \"gsi3_pk\": {\"S\": \"EMAIL#bob@foosball.local\"},
        \"gsi3_sk\": {\"S\": \"PLAYER#player-003\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"PLAYER#player-004\"},
        \"entity_type\": {\"S\": \"PLAYER\"},
        \"player_id\": {\"S\": \"player-004\"},
        \"cognito_sub\": {\"S\": \"cognito-sub-004\"},
        \"display_name\": {\"S\": \"Carol Goalie\"},
        \"email\": {\"S\": \"carol@foosball.local\"},
        \"total_matches\": {\"N\": \"4\"},
        \"total_wins\": {\"N\": \"2\"},
        \"total_losses\": {\"N\": \"2\"},
        \"gsi3_pk\": {\"S\": \"EMAIL#carol@foosball.local\"},
        \"gsi3_sk\": {\"S\": \"PLAYER#player-004\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "4 players seeded."

# --------------------------------------------------
# Seed Leagues
# --------------------------------------------------

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"LEAGUE#league-001\"},
        \"entity_type\": {\"S\": \"LEAGUE\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"name\": {\"S\": \"Office Champions 2v2\"},
        \"league_type\": {\"S\": \"2v2\"},
        \"initial_elo\": {\"N\": \"1200\"},
        \"description\": {\"S\": \"The main office 2v2 league\"},
        \"created_by\": {\"S\": \"player-001\"},
        \"invite_code\": {\"S\": \"OFF2V2\"},
        \"member_count\": {\"N\": \"4\"},
        \"match_count\": {\"N\": \"4\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"LEAGUE#league-001\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"LEAGUE#league-002\"},
        \"entity_type\": {\"S\": \"LEAGUE\"},
        \"league_id\": {\"S\": \"league-002\"},
        \"name\": {\"S\": \"1v1 Quick Matches\"},
        \"league_type\": {\"S\": \"1v1\"},
        \"initial_elo\": {\"N\": \"1200\"},
        \"description\": {\"S\": \"Fast 1v1 games during lunch\"},
        \"created_by\": {\"S\": \"player-002\"},
        \"invite_code\": {\"S\": \"QCK1V1\"},
        \"member_count\": {\"N\": \"2\"},
        \"match_count\": {\"N\": \"2\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-002\"},
        \"gsi1_sk\": {\"S\": \"LEAGUE#league-002\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "2 leagues seeded."

# --------------------------------------------------
# Seed Enrollments (league members)
# --------------------------------------------------

# League 1: all 4 players
for i in 001 002 003 004; do
    DISPLAY_NAMES_001="Local Dev"
    DISPLAY_NAMES_002="Alice Spin"
    DISPLAY_NAMES_003="Bob Striker"
    DISPLAY_NAMES_004="Carol Goalie"
    eval "DNAME=\$DISPLAY_NAMES_$i"
    ROLE="player"
    if [ "$i" = "001" ]; then ROLE="admin"; fi

    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"ENROLL#league-001#player-$i\"},
            \"entity_type\": {\"S\": \"ENROLLMENT\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"player_id\": {\"S\": \"player-$i\"},
            \"display_name\": {\"S\": \"$DNAME\"},
            \"role\": {\"S\": \"$ROLE\"},
            \"current_elo\": {\"N\": \"1200\"},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"ENROLL#player-$i\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

# League 2: players 001 and 002
for i in 001 002; do
    eval "DNAME=\$DISPLAY_NAMES_$i"
    ROLE="player"
    if [ "$i" = "001" ]; then ROLE="admin"; fi

    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"ENROLL#league-002#player-$i\"},
            \"entity_type\": {\"S\": \"ENROLLMENT\"},
            \"league_id\": {\"S\": \"league-002\"},
            \"player_id\": {\"S\": \"player-$i\"},
            \"display_name\": {\"S\": \"$DNAME\"},
            \"role\": {\"S\": \"$ROLE\"},
            \"current_elo\": {\"N\": \"1200\"},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-002\"},
            \"gsi1_sk\": {\"S\": \"ENROLL#player-$i\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "Enrollments seeded."

# --------------------------------------------------
# Seed Ratings (ELO per player per league)
# --------------------------------------------------

# League 1 ratings (varied ELO for interesting leaderboard)
# Player 001: 1280 ELO, 4W 2L  -> inverted: 9999-1280 = 8719
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-001#player-001\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"player_id\": {\"S\": \"player-001\"},
        \"display_name\": {\"S\": \"Local Dev\"},
        \"elo\": {\"N\": \"1280\"},
        \"matches_played\": {\"N\": \"6\"},
        \"wins\": {\"N\": \"4\"},
        \"losses\": {\"N\": \"2\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"RATING#8719#player-001\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

# Player 002: 1220 ELO, 3W 3L -> inverted: 8779
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-001#player-002\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"player_id\": {\"S\": \"player-002\"},
        \"display_name\": {\"S\": \"Alice Spin\"},
        \"elo\": {\"N\": \"1220\"},
        \"matches_played\": {\"N\": \"6\"},
        \"wins\": {\"N\": \"3\"},
        \"losses\": {\"N\": \"3\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"RATING#8779#player-002\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

# Player 003: 1140 ELO, 1W 3L -> inverted: 8859
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-001#player-003\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"player_id\": {\"S\": \"player-003\"},
        \"display_name\": {\"S\": \"Bob Striker\"},
        \"elo\": {\"N\": \"1140\"},
        \"matches_played\": {\"N\": \"4\"},
        \"wins\": {\"N\": \"1\"},
        \"losses\": {\"N\": \"3\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"RATING#8859#player-003\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

# Player 004: 1160 ELO, 2W 2L -> inverted: 8839
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-001#player-004\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"player_id\": {\"S\": \"player-004\"},
        \"display_name\": {\"S\": \"Carol Goalie\"},
        \"elo\": {\"N\": \"1160\"},
        \"matches_played\": {\"N\": \"4\"},
        \"wins\": {\"N\": \"2\"},
        \"losses\": {\"N\": \"2\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"RATING#8839#player-004\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

# League 2 ratings
# Player 001: 1250 ELO, 2W 0L -> inverted: 8749
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-002#player-001\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-002\"},
        \"player_id\": {\"S\": \"player-001\"},
        \"display_name\": {\"S\": \"Local Dev\"},
        \"elo\": {\"N\": \"1250\"},
        \"matches_played\": {\"N\": \"2\"},
        \"wins\": {\"N\": \"2\"},
        \"losses\": {\"N\": \"0\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-002\"},
        \"gsi1_sk\": {\"S\": \"RATING#8749#player-001\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

# Player 002: 1150 ELO, 0W 2L -> inverted: 8849
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-002#player-002\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-002\"},
        \"player_id\": {\"S\": \"player-002\"},
        \"display_name\": {\"S\": \"Alice Spin\"},
        \"elo\": {\"N\": \"1150\"},
        \"matches_played\": {\"N\": \"2\"},
        \"wins\": {\"N\": \"0\"},
        \"losses\": {\"N\": \"2\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-002\"},
        \"gsi1_sk\": {\"S\": \"RATING#8849#player-002\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "Ratings seeded."

# --------------------------------------------------
# Seed Matches (league 1: 4 matches, league 2: 2 matches)
# --------------------------------------------------

# League 1, Match 1: Team(001,002) 10 vs Team(003,004) 7 - CONFIRMED
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"MATCH#match-001\"},
        \"entity_type\": {\"S\": \"MATCH\"},
        \"match_id\": {\"S\": \"match-001\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"team1_player_ids\": {\"L\": [{\"S\": \"player-001\"}, {\"S\": \"player-002\"}]},
        \"team2_player_ids\": {\"L\": [{\"S\": \"player-003\"}, {\"S\": \"player-004\"}]},
        \"team1_score\": {\"N\": \"10\"},
        \"team2_score\": {\"N\": \"7\"},
        \"status\": {\"S\": \"CONFIRMED\"},
        \"submitted_by\": {\"S\": \"player-001\"},
        \"confirmed_by\": {\"S\": \"player-003\"},
        \"elo_changes\": {\"M\": {}},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"MATCH#2026-03-05T14:00:00Z#match-001\"},
        \"created_at\": {\"S\": \"2026-03-05T14:00:00Z\"},
        \"updated_at\": {\"S\": \"2026-03-05T14:00:00Z\"}
    }"

# League 1, Match 2: Team(003,001) 10 vs Team(002,004) 8 - CONFIRMED
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"MATCH#match-002\"},
        \"entity_type\": {\"S\": \"MATCH\"},
        \"match_id\": {\"S\": \"match-002\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"team1_player_ids\": {\"L\": [{\"S\": \"player-003\"}, {\"S\": \"player-001\"}]},
        \"team2_player_ids\": {\"L\": [{\"S\": \"player-002\"}, {\"S\": \"player-004\"}]},
        \"team1_score\": {\"N\": \"10\"},
        \"team2_score\": {\"N\": \"8\"},
        \"status\": {\"S\": \"CONFIRMED\"},
        \"submitted_by\": {\"S\": \"player-003\"},
        \"confirmed_by\": {\"S\": \"player-002\"},
        \"elo_changes\": {\"M\": {}},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"MATCH#2026-03-07T10:30:00Z#match-002\"},
        \"created_at\": {\"S\": \"2026-03-07T10:30:00Z\"},
        \"updated_at\": {\"S\": \"2026-03-07T10:30:00Z\"}
    }"

# League 1, Match 3: Team(001,004) 10 vs Team(002,003) 6 - CONFIRMED
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"MATCH#match-003\"},
        \"entity_type\": {\"S\": \"MATCH\"},
        \"match_id\": {\"S\": \"match-003\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"team1_player_ids\": {\"L\": [{\"S\": \"player-001\"}, {\"S\": \"player-004\"}]},
        \"team2_player_ids\": {\"L\": [{\"S\": \"player-002\"}, {\"S\": \"player-003\"}]},
        \"team1_score\": {\"N\": \"10\"},
        \"team2_score\": {\"N\": \"6\"},
        \"status\": {\"S\": \"CONFIRMED\"},
        \"submitted_by\": {\"S\": \"player-001\"},
        \"confirmed_by\": {\"S\": \"player-004\"},
        \"elo_changes\": {\"M\": {}},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"MATCH#2026-03-09T16:00:00Z#match-003\"},
        \"created_at\": {\"S\": \"2026-03-09T16:00:00Z\"},
        \"updated_at\": {\"S\": \"2026-03-09T16:00:00Z\"}
    }"

# League 1, Match 4: Team(002,004) 10 vs Team(001,003) 9 - CONFIRMED
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"MATCH#match-004\"},
        \"entity_type\": {\"S\": \"MATCH\"},
        \"match_id\": {\"S\": \"match-004\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"team1_player_ids\": {\"L\": [{\"S\": \"player-002\"}, {\"S\": \"player-004\"}]},
        \"team2_player_ids\": {\"L\": [{\"S\": \"player-001\"}, {\"S\": \"player-003\"}]},
        \"team1_score\": {\"N\": \"10\"},
        \"team2_score\": {\"N\": \"9\"},
        \"status\": {\"S\": \"CONFIRMED\"},
        \"submitted_by\": {\"S\": \"player-002\"},
        \"confirmed_by\": {\"S\": \"player-001\"},
        \"elo_changes\": {\"M\": {}},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"MATCH#2026-03-11T13:00:00Z#match-004\"},
        \"created_at\": {\"S\": \"2026-03-11T13:00:00Z\"},
        \"updated_at\": {\"S\": \"2026-03-11T13:00:00Z\"}
    }"

# League 2, Match 5: 001 vs 002, 10-5 - CONFIRMED
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"MATCH#match-005\"},
        \"entity_type\": {\"S\": \"MATCH\"},
        \"match_id\": {\"S\": \"match-005\"},
        \"league_id\": {\"S\": \"league-002\"},
        \"team1_player_ids\": {\"L\": [{\"S\": \"player-001\"}]},
        \"team2_player_ids\": {\"L\": [{\"S\": \"player-002\"}]},
        \"team1_score\": {\"N\": \"10\"},
        \"team2_score\": {\"N\": \"5\"},
        \"status\": {\"S\": \"CONFIRMED\"},
        \"submitted_by\": {\"S\": \"player-001\"},
        \"confirmed_by\": {\"S\": \"player-002\"},
        \"elo_changes\": {\"M\": {}},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-002\"},
        \"gsi1_sk\": {\"S\": \"MATCH#2026-03-06T12:00:00Z#match-005\"},
        \"created_at\": {\"S\": \"2026-03-06T12:00:00Z\"},
        \"updated_at\": {\"S\": \"2026-03-06T12:00:00Z\"}
    }"

# League 2, Match 6: 001 vs 002, 10-8 - CONFIRMED
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"MATCH#match-006\"},
        \"entity_type\": {\"S\": \"MATCH\"},
        \"match_id\": {\"S\": \"match-006\"},
        \"league_id\": {\"S\": \"league-002\"},
        \"team1_player_ids\": {\"L\": [{\"S\": \"player-001\"}]},
        \"team2_player_ids\": {\"L\": [{\"S\": \"player-002\"}]},
        \"team1_score\": {\"N\": \"10\"},
        \"team2_score\": {\"N\": \"8\"},
        \"status\": {\"S\": \"CONFIRMED\"},
        \"submitted_by\": {\"S\": \"player-001\"},
        \"confirmed_by\": {\"S\": \"player-002\"},
        \"elo_changes\": {\"M\": {}},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-002\"},
        \"gsi1_sk\": {\"S\": \"MATCH#2026-03-10T12:30:00Z#match-006\"},
        \"created_at\": {\"S\": \"2026-03-10T12:30:00Z\"},
        \"updated_at\": {\"S\": \"2026-03-10T12:30:00Z\"}
    }"

echo "6 matches seeded."

echo "============================================"
echo "  LocalStack Init Complete"
echo "============================================"
