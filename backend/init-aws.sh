#!/bin/bash

export AWS_DEFAULT_REGION=eu-west-1

echo "============================================"
echo "  FoosRank - LocalStack Init"
echo "============================================"

# --------------------------------------------------
# DynamoDB Table
# --------------------------------------------------

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

echo "[OK] DynamoDB table created"

awslocal dynamodb update-time-to-live \
    --table-name foosball-league \
    --time-to-live-specification "Enabled=true, AttributeName=expires_at" \
    >/dev/null

echo "[OK] DynamoDB TTL enabled on 'expires_at'"

# --------------------------------------------------
# Constants
# --------------------------------------------------

TENANT="TENANT#default"
NOW="2026-03-01T12:00:00Z"
INVITE_CODE="FOOS42"

# Test user (your Cognito account) — override with env vars for other devs
TEST_USER_SUB="${TEST_USER_SUB:-02651474-b031-70f8-a92a-a768ac3b6b19}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-pettasimonepaolo@gmail.com}"
TEST_USER_NAME="${TEST_USER_NAME:-Simi24}"
TEST_USER_ID="player-test"

# --------------------------------------------------
# Tenant
# --------------------------------------------------

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

echo "[OK] Tenant seeded"

# --------------------------------------------------
# Players (8 bots - your player is created at login)
# --------------------------------------------------

declare -A PLAYERS
PLAYERS[001]="Mark Thompson:mark@foosball.local"
PLAYERS[002]="Olivia Brooks:olivia@foosball.local"
PLAYERS[003]="Sam Carter:sam@foosball.local"
PLAYERS[004]="Emma Davis:emma@foosball.local"
PLAYERS[005]="Jordan Lee:jordan@foosball.local"
PLAYERS[006]="Ryan Walsh:ryan@foosball.local"
PLAYERS[007]="Noah Bennett:noah@foosball.local"
PLAYERS[008]="Liam Foster:liam@foosball.local"

for ID in 001 002 003 004 005 006 007 008; do
    IFS=':' read -r DNAME EMAIL <<< "${PLAYERS[$ID]}"
    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"PLAYER#player-$ID\"},
            \"entity_type\": {\"S\": \"PLAYER\"},
            \"player_id\": {\"S\": \"player-$ID\"},
            \"cognito_sub\": {\"S\": \"bot-sub-$ID\"},
            \"display_name\": {\"S\": \"$DNAME\"},
            \"email\": {\"S\": \"$EMAIL\"},
            \"total_matches\": {\"N\": \"0\"},
            \"total_wins\": {\"N\": \"0\"},
            \"total_losses\": {\"N\": \"0\"},
            \"gsi3_pk\": {\"S\": \"$EMAIL\"},
            \"gsi3_sk\": {\"S\": \"PLAYER#player-$ID\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "[OK] 8 players seeded"

# Test user player
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"PLAYER#$TEST_USER_ID\"},
        \"entity_type\": {\"S\": \"PLAYER\"},
        \"player_id\": {\"S\": \"$TEST_USER_ID\"},
        \"cognito_sub\": {\"S\": \"$TEST_USER_SUB\"},
        \"display_name\": {\"S\": \"$TEST_USER_NAME\"},
        \"email\": {\"S\": \"$TEST_USER_EMAIL\"},
        \"total_matches\": {\"N\": \"0\"},
        \"total_wins\": {\"N\": \"0\"},
        \"total_losses\": {\"N\": \"0\"},
        \"gsi3_pk\": {\"S\": \"$TEST_USER_EMAIL\"},
        \"gsi3_sk\": {\"S\": \"PLAYER#$TEST_USER_ID\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "[OK] Test user seeded ($TEST_USER_EMAIL)"

# --------------------------------------------------
# League
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
        \"description\": {\"S\": \"The official office foosball league\"},
        \"created_by\": {\"S\": \"player-001\"},
        \"invite_code\": {\"S\": \"$INVITE_CODE\"},
        \"member_count\": {\"N\": \"9\"},
        \"match_count\": {\"N\": \"10\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"LEAGUE#league-001\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "[OK] League seeded (invite code: $INVITE_CODE)"

# --------------------------------------------------
# Enrollments
# --------------------------------------------------

declare -A DNAMES
DNAMES[001]="Mark Thompson"
DNAMES[002]="Olivia Brooks"
DNAMES[003]="Sam Carter"
DNAMES[004]="Emma Davis"
DNAMES[005]="Jordan Lee"
DNAMES[006]="Ryan Walsh"
DNAMES[007]="Noah Bennett"
DNAMES[008]="Liam Foster"

for ID in 001 002 003 004 005 006 007 008; do
    ROLE="player"
    if [ "$ID" = "001" ]; then ROLE="admin"; fi

    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"ENROLL#league-001#player-$ID\"},
            \"entity_type\": {\"S\": \"ENROLLMENT\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"player_id\": {\"S\": \"player-$ID\"},
            \"display_name\": {\"S\": \"${DNAMES[$ID]}\"},
            \"role\": {\"S\": \"$ROLE\"},
            \"current_elo\": {\"N\": \"1200\"},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"ENROLL#player-$ID\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "[OK] Enrollments seeded"

# Test user enrollment (admin!)
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"ENROLL#league-001#$TEST_USER_ID\"},
        \"entity_type\": {\"S\": \"ENROLLMENT\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"player_id\": {\"S\": \"$TEST_USER_ID\"},
        \"display_name\": {\"S\": \"$TEST_USER_NAME\"},
        \"role\": {\"S\": \"admin\"},
        \"current_elo\": {\"N\": \"1200\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"ENROLL#$TEST_USER_ID\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "[OK] Test user enrolled as admin"

# --------------------------------------------------
# Ratings
# --------------------------------------------------

declare -A ELOS WINS LOSSES PLAYED
ELOS[001]=1320; WINS[001]=9; LOSSES[001]=3; PLAYED[001]=12
ELOS[002]=1275; WINS[002]=7; LOSSES[002]=4; PLAYED[002]=11
ELOS[003]=1240; WINS[003]=6; LOSSES[003]=4; PLAYED[003]=10
ELOS[004]=1210; WINS[004]=5; LOSSES[004]=5; PLAYED[004]=10
ELOS[005]=1180; WINS[005]=4; LOSSES[005]=6; PLAYED[005]=10
ELOS[006]=1150; WINS[006]=3; LOSSES[006]=6; PLAYED[006]=9
ELOS[007]=1120; WINS[007]=2; LOSSES[007]=7; PLAYED[007]=9
ELOS[008]=1090; WINS[008]=1; LOSSES[008]=7; PLAYED[008]=8

for ID in 001 002 003 004 005 006 007 008; do
    INV_ELO=$(printf "%04d" $((9999 - ${ELOS[$ID]})))
    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"RATING#league-001#player-$ID\"},
            \"entity_type\": {\"S\": \"RATING\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"player_id\": {\"S\": \"player-$ID\"},
            \"display_name\": {\"S\": \"${DNAMES[$ID]}\"},
            \"elo\": {\"N\": \"${ELOS[$ID]}\"},
            \"matches_played\": {\"N\": \"${PLAYED[$ID]}\"},
            \"wins\": {\"N\": \"${WINS[$ID]}\"},
            \"losses\": {\"N\": \"${LOSSES[$ID]}\"},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"RATING#${INV_ELO}#player-$ID\"},
            \"created_at\": {\"S\": \"$NOW\"},
            \"updated_at\": {\"S\": \"$NOW\"}
        }"
done

echo "[OK] Ratings seeded"

# Test user rating
TEST_USER_ELO=1225
INV_ELO_TEST=$(printf "%04d" $((9999 - TEST_USER_ELO)))
awslocal dynamodb put-item \
    --table-name foosball-league \
    --item "{
        \"pk\": {\"S\": \"$TENANT\"},
        \"sk\": {\"S\": \"RATING#league-001#$TEST_USER_ID\"},
        \"entity_type\": {\"S\": \"RATING\"},
        \"league_id\": {\"S\": \"league-001\"},
        \"player_id\": {\"S\": \"$TEST_USER_ID\"},
        \"display_name\": {\"S\": \"$TEST_USER_NAME\"},
        \"elo\": {\"N\": \"$TEST_USER_ELO\"},
        \"matches_played\": {\"N\": \"6\"},
        \"wins\": {\"N\": \"4\"},
        \"losses\": {\"N\": \"2\"},
        \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
        \"gsi1_sk\": {\"S\": \"RATING#${INV_ELO_TEST}#$TEST_USER_ID\"},
        \"created_at\": {\"S\": \"$NOW\"},
        \"updated_at\": {\"S\": \"$NOW\"}
    }"

echo "[OK] Test user rating seeded"

# --------------------------------------------------
# Matches (10 confirmed)
# --------------------------------------------------

declare -A MATCHES
# format: "t1p1,t1p2:t2p1,t2p2:score1:score2:date"
MATCHES[001]="player-001,player-003:player-007,player-008:10:4:2026-03-02T14:00:00Z"
MATCHES[002]="player-002,player-005:player-004,player-006:10:7:2026-03-04T10:30:00Z"
MATCHES[003]="player-001,player-004:player-003,player-002:10:8:2026-03-06T16:00:00Z"
MATCHES[004]="player-006,player-007:player-005,player-008:10:9:2026-03-08T13:00:00Z"
MATCHES[005]="player-001,player-005:player-002,player-008:10:6:2026-03-10T15:00:00Z"
MATCHES[006]="player-002,player-007:player-004,player-006:10:7:2026-03-12T11:00:00Z"
MATCHES[007]="player-001,player-002:player-003,player-004:10:9:2026-03-14T17:00:00Z"
MATCHES[008]="$TEST_USER_ID,player-003:player-007,player-008:10:5:2026-03-16T12:00:00Z"
MATCHES[009]="player-001,$TEST_USER_ID:player-005,player-006:10:7:2026-03-18T14:30:00Z"
MATCHES[010]="player-002,player-004:$TEST_USER_ID,player-008:10:8:2026-03-20T16:00:00Z"

for MID in 001 002 003 004 005 006 007 008 009 010; do
    IFS=':' read -r T1 T2 S1 S2 DATE <<< "${MATCHES[$MID]}"
    IFS=',' read -r T1P1 T1P2 <<< "$T1"
    IFS=',' read -r T2P1 T2P2 <<< "$T2"

    awslocal dynamodb put-item \
        --table-name foosball-league \
        --item "{
            \"pk\": {\"S\": \"$TENANT\"},
            \"sk\": {\"S\": \"MATCH#match-$MID\"},
            \"entity_type\": {\"S\": \"MATCH\"},
            \"match_id\": {\"S\": \"match-$MID\"},
            \"league_id\": {\"S\": \"league-001\"},
            \"team1_player_ids\": {\"L\": [{\"S\": \"$T1P1\"}, {\"S\": \"$T1P2\"}]},
            \"team2_player_ids\": {\"L\": [{\"S\": \"$T2P1\"}, {\"S\": \"$T2P2\"}]},
            \"team1_score\": {\"N\": \"$S1\"},
            \"team2_score\": {\"N\": \"$S2\"},
            \"status\": {\"S\": \"CONFIRMED\"},
            \"submitted_by\": {\"S\": \"$T1P1\"},
            \"confirmed_by\": {\"S\": \"$T2P1\"},
            \"elo_changes\": {\"M\": {}},
            \"gsi1_pk\": {\"S\": \"LEAGUE#league-001\"},
            \"gsi1_sk\": {\"S\": \"MATCH#${DATE}#match-$MID\"},
            \"created_at\": {\"S\": \"$DATE\"},
            \"updated_at\": {\"S\": \"$DATE\"}
        }"
done

echo "[OK] 10 matches seeded"

# --------------------------------------------------
# ELO History (15 points per player for chart)
# --------------------------------------------------

declare -A TRAJECTORIES
TRAJECTORIES[001]="1200 1215 1230 1220 1240 1255 1245 1265 1280 1270 1290 1300 1290 1310 1320"
TRAJECTORIES[002]="1200 1210 1225 1215 1235 1245 1230 1250 1260 1245 1265 1280 1265 1285 1275"
TRAJECTORIES[003]="1200 1215 1225 1210 1230 1220 1235 1250 1235 1245 1230 1245 1255 1245 1240"
TRAJECTORIES[004]="1200 1210 1195 1205 1220 1210 1225 1210 1225 1210 1225 1240 1225 1215 1210"
TRAJECTORIES[005]="1200 1190 1205 1195 1185 1200 1190 1200 1190 1175 1185 1195 1180 1190 1180"
TRAJECTORIES[006]="1200 1195 1185 1200 1190 1175 1185 1170 1180 1165 1175 1160 1170 1155 1150"
TRAJECTORIES[007]="1200 1190 1180 1195 1180 1170 1180 1165 1175 1160 1145 1155 1140 1130 1120"
TRAJECTORIES[008]="1200 1185 1170 1185 1170 1155 1170 1155 1145 1130 1140 1125 1115 1105 1090"

for ID in 001 002 003 004 005 006 007 008; do
    read -ra TRAJ <<< "${TRAJECTORIES[$ID]}"
    PREV=${TRAJ[0]}
    for i in $(seq 1 $((${#TRAJ[@]} - 1))); do
        ELO=${TRAJ[$i]}
        DELTA=$((ELO - PREV))
        PREV=$ELO
        DAY=$((i * 2))
        TS=$(printf "2026-02-%02dT%02d:00:00Z" $((DAY % 28 + 1)) $((10 + i % 8)))
        MATCH_ID=$(printf "seed%04x" $((RANDOM)))

        awslocal dynamodb put-item \
            --table-name foosball-league \
            --item "{
                \"pk\": {\"S\": \"$TENANT\"},
                \"sk\": {\"S\": \"ELOHIST#league-001#player-$ID#$TS\"},
                \"entity_type\": {\"S\": \"ELO_HISTORY\"},
                \"league_id\": {\"S\": \"league-001\"},
                \"player_id\": {\"S\": \"player-$ID\"},
                \"match_id\": {\"S\": \"$MATCH_ID\"},
                \"elo\": {\"N\": \"$ELO\"},
                \"delta\": {\"N\": \"$DELTA\"},
                \"created_at\": {\"S\": \"$TS\"},
                \"updated_at\": {\"S\": \"$TS\"}
            }"
    done
done

echo "[OK] ELO history seeded (15 points per player)"

# --------------------------------------------------
# Done
# --------------------------------------------------

echo ""
echo "============================================"
echo "  LocalStack Init Complete!"
echo "============================================"
echo ""
echo "  League: Office Champions 2v2"
echo "  Players: Mark, Olivia, Sam, Emma, Jordan, Ryan, Noah, Liam"
echo ""
echo "  ┌──────────────────────────────────┐"
echo "  │  INVITE CODE:  $INVITE_CODE            │"
echo "  └──────────────────────────────────┘"
echo ""
echo "  1. Login with your Cognito account"
echo "  2. Register as 'Simi25'"
echo "  3. Click 'Join League' on Dashboard"
echo "  4. Enter code: $INVITE_CODE"
echo "  5. Play!"
echo ""
