from flask import Flask, jsonify, request, g, session, send_from_directory
import sqlite3
from flask_cors import CORS
from contextlib import contextmanager
import os
import pandas as pd
import random
import re
from datetime import datetime
import trueskill
from trueskill import Rating, rate, setup as trueskill_setup
import scipy.stats as stats

# Initialize TrueSkill with identical settings
trueskill_setup(draw_probability=0)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
app.secret_key = 'cheetos'  # Set a secret key for session encryption

# Get the absolute path to the database
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(CURRENT_DIR, 'badminton_club.db')

def calculate_win_probability(team1, team2):
    delta_mu = team1.mu - team2.mu
    sum_sigma = (team1.sigma ** 2 + team2.sigma ** 2) ** 0.5
    ts = trueskill.global_env()
    denom = (2 * (ts.beta ** 2)) ** 0.5
    return stats.norm.cdf(delta_mu / denom)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Utility Functions
def get_schedule_from_db(num_players, num_courts, num_rounds):
    with get_db() as conn:
        query = """
            SELECT sr.round_index, sr.pairs
            FROM Schedules s
            JOIN ScheduleRounds sr ON s.schedule_id = sr.schedule_id
            WHERE s.num_players = ? AND s.num_courts = ? AND s.num_rounds = ?
            ORDER BY sr.round_index
        """
        schedule_df = pd.read_sql_query(query, conn, params=(num_players, num_courts, num_rounds))
        return schedule_df if not schedule_df.empty else None

def replace_pairs_with_names(pair_str, mapping):
    def repl(match):
        num1 = int(match.group(1))
        num2 = int(match.group(2))
        name1 = mapping.get(num1, str(num1))
        name2 = mapping.get(num2, str(num2))
        return f"({name1},{name2})"
    pattern = r'\((\d+),(\d+)\)'
    return re.sub(pattern, repl, pair_str)

def query_db(query, args=(), one=False):
    with get_db() as db:
        cur = db.cursor()
        cur.execute(query, args)
        rv = cur.fetchall()
        db.commit()
        return (rv[0] if rv else None) if one else rv

# API Routes
@app.route('/')
def index():
    return jsonify({
        "message": "Badminton Club Manager API",
        "available_endpoints": [
            "/api/hello",
            "/api/players",
            "/api/matches",
            "/api/feasible-rounds",
            "/api/update-scores",
            "/api/generate-fixtures"
        ]
    })

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Hello from Python!"})

@app.route('/api/players')
def get_players():
    search = request.args.get('search', '')
    try:
        with get_db() as db:
            if search:
                query = "SELECT player_id, name, avatar_url, role FROM Players WHERE name LIKE ? LIMIT 10"
                players = query_db(query, [f"%{search}%"])
            else:
                players = query_db('SELECT player_id, name, avatar_url, role FROM Players')
            return jsonify([dict(player) for player in players])
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/matches')
def get_matches():
    try:
        query = '''
            SELECT 
                m.*,
                p1.name AS player1_name, 
                p2.name AS player2_name, 
                p3.name AS player3_name, 
                p4.name AS player4_name
            FROM Matches m
            LEFT JOIN Players p1 ON m.player1_id = p1.player_id
            LEFT JOIN Players p2 ON m.player2_id = p2.player_id
            LEFT JOIN Players p3 ON m.player3_id = p3.player_id
            LEFT JOIN Players p4 ON m.player4_id = p4.player_id
        '''
        matches = query_db(query)
        return jsonify([dict(match) for match in matches])
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/feasible-rounds')
def get_feasible_rounds():
    courts = request.args.get("courts", type=int)
    players = request.args.get("players", type=int)
    
    if not courts or not players:
        return jsonify({"error": "Missing required parameters"}), 400

    try:
        query = """
            SELECT round
            FROM feasible_rounds
            WHERE number_of_courts = ? AND number_of_players = ?
        """
        rounds = query_db(query, [courts, players])
        return jsonify([dict(round) for round in rounds])
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/update-scores', methods=['POST'])
def update_scores():
    form_data = request.form
    print("Score update form data:", form_data)

    try:
        db = get_db()
        cur = db.cursor()
        
        # Get player IDs from names
        player_ids = []
        for player_key in ['player1_1', 'player2_1', 'player3_1', 'player4_1']:
            player_name = form_data.get(player_key)
            cur.execute("SELECT player_id FROM players WHERE name = ?", (player_name,))
            result = cur.fetchone()
            if result is None:
                return jsonify({
                    "status": "error",
                    "message": f"Player not found: {player_name}"
                }), 400
            player_ids.append(result[0])
        
        # Insert match result
        query = """
            INSERT INTO matches (
                match_date, match_type, game_mode_type,
                player1_id, player2_id, player3_id, player4_id,
                player1_score, player2_score, player3_score, player4_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        team1_score = form_data.get('team1_score_1')
        team2_score = form_data.get('team2_score_1')
        
        cur.execute(query, (
            form_data.get('match_date'),
            form_data.get('match_type'),
            form_data.get('game_mode'),
            player_ids[0],  # player1_id
            player_ids[1],  # player2_id
            player_ids[2],  # player3_id
            player_ids[3],  # player4_id
            team1_score,    # player1_score
            team1_score,    # player2_score (same as team1)
            team2_score,    # player3_score
            team2_score     # player4_score (same as team2)
        ))

        db.commit()
        print("Match saved successfully")

        # After successfully creating the match, process ratings
        process_unrated_matches()
        
        return jsonify({"status": "success", "message": "Match and ratings updated successfully"})

    except Exception as e:
        print(f"Error updating scores: {str(e)}")
        db.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-fixtures', methods=['POST'])
def generate_fixtures():
    data = request.get_json()
    
    try:
        selected_players_ids = data.get('players', [])
        num_courts = int(data.get('courts', 0))
        num_rounds = int(data.get('rounds', 0))
        match_date = data.get('match_date')
        match_type = data.get('match_type')
        game_mode = data.get('game_mode')

        if not all([selected_players_ids, num_courts, num_rounds, match_date]):
            return jsonify({
                "status": "error",
                "message": "Missing required parameters"
            }), 400

        # Get player names
        with get_db() as db:
            cur = db.cursor()
            placeholders = ','.join('?' * len(selected_players_ids))
            query = f"SELECT player_id, name FROM Players WHERE player_id IN ({placeholders})"
            cur.execute(query, selected_players_ids)
            players = cur.fetchall()

        selected_players = [p[1] for p in players]
        num_players = len(selected_players)

        # Get schedule
        schedule_df = get_schedule_from_db(num_players, num_courts, num_rounds)
        if schedule_df is None:
            return jsonify({
                "status": "error",
                "message": "No schedule found for the selected inputs"
            }), 404

        # Create randomized mapping
        temp_players = selected_players.copy()
        random.shuffle(temp_players)
        mapping = {i: temp_players[i] for i in range(num_players)}

        # Replace numeric pairs with names
        schedule_df['pairs'] = schedule_df['pairs'].apply(
            lambda x: replace_pairs_with_names(x, mapping)
        )

        # Process schedule data
        schedule_data = []
        for _, row in schedule_df.iterrows():
            pairs_list = row['pairs'].split(';')
            for i in range(0, len(pairs_list), 2):
                team1 = pairs_list[i].strip() if i < len(pairs_list) else ""
                team2 = pairs_list[i+1].strip() if i+1 < len(pairs_list) else ""

                team1_players = team1.strip('()').split(',') if team1 else []
                team2_players = team2.strip('()').split(',') if team2 else []

                schedule_data.append({
                    'round': row['round_index'],
                    'date': match_date,
                    'game_mode': game_mode,
                    'match_type': match_type,
                    'player1': team1_players[0] if len(team1_players) > 0 else "",
                    'player2': team1_players[1] if len(team1_players) > 1 else "",
                    'player3': team2_players[0] if len(team2_players) > 0 else "",
                    'player4': team2_players[1] if len(team2_players) > 1 else "",
                })

        return jsonify({
            "status": "success",
            "schedule": schedule_data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/schedules', methods=['GET', 'POST'])
def create_schedule():
    print(f"Request method: {request.method}")
    print(f"Request headers: {request.headers}")
    if request.method == 'POST':
        data = request.get_json()
        print(f"Received data: {data}")
        num_courts = data.get('num_courts')
        num_players = data.get('num_players')
        num_rounds = data.get('num_rounds')

        try:
            # Get schedule from the database
            schedule_df = get_schedule_from_db(num_players, num_courts, num_rounds)
            print(f"Schedule DataFrame: {schedule_df}")
            
            if schedule_df is None:
                print("No schedule found in database")
                return jsonify({"error": "No schedule found for the given parameters"}), 404

            # Get the first schedule_id from the database
            with get_db() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT schedule_id 
                    FROM Schedules 
                    WHERE num_players = ? AND num_courts = ? AND num_rounds = ? 
                    LIMIT 1
                """
                print(f"Executing query: {query} with params: {(num_players, num_courts, num_rounds)}")
                cursor.execute(query, (num_players, num_courts, num_rounds))
                result = cursor.fetchone()
                schedule_id = result[0] if result else None
                print(f"Found schedule_id: {schedule_id}")

            if schedule_id is None:
                print("No schedule_id found")
                return jsonify({"error": "No schedule_id found"}), 404

            response = {"schedule_id": schedule_id}
            print(f"Sending response: {response}")
            return jsonify(response)

        except Exception as e:
            print(f"Error: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Please use POST method"}), 405

@app.route('/api/schedule-rounds/<int:schedule_id>', methods=['GET'])
def get_schedule_rounds(schedule_id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # First get the schedule details
            cursor.execute("""
                SELECT num_players, num_courts 
                FROM Schedules 
                WHERE schedule_id = ?
            """, (schedule_id,))
            schedule = cursor.fetchone()
            if not schedule:
                return jsonify({"error": "Schedule not found"}), 404
            
            num_players = schedule['num_players']
            num_courts = schedule['num_courts']

            # Get all rounds for this schedule
            query = """
                SELECT round_index, pairs
                FROM ScheduleRounds
                WHERE schedule_id = ?
                ORDER BY round_index
            """
            cursor.execute(query, (schedule_id,))
            rounds = cursor.fetchall()
            
            if not rounds:
                return jsonify({"error": "No rounds found for this schedule"}), 404

            # Create a randomized mapping
            player_numbers = list(range(num_players))
            random.shuffle(player_numbers)
            mapping = {i: player_numbers[i] for i in range(num_players)}

            # Process each round's pairs with the randomized mapping
            rounds_data = []
            for round in rounds:
                # Split pairs into separate matches
                pairs_list = round['pairs'].split(';')
                for court in range(num_courts):
                    # Get the two pairs for this court
                    court_start = court * 2
                    if court_start < len(pairs_list):
                        team1_pair = pairs_list[court_start].strip('()').split(',')
                        team2_pair = pairs_list[court_start + 1].strip('()').split(',') if court_start + 1 < len(pairs_list) else ['','']
                        
                        # Map the player numbers using the randomized mapping
                        team1 = [str(mapping[int(p)]) for p in team1_pair]
                        team2 = [str(mapping[int(p)]) for p in team2_pair]
                        
                        rounds_data.append({
                            "round": round['round_index'],
                            "court": court + 1,
                            "team1": team1,
                            "team2": team2
                        })

            return jsonify(rounds_data)

    except Exception as e:
        print(f"Error fetching rounds: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/matches/<match_id>', methods=['PUT'])
def update_match(match_id):
    try:
        data = request.get_json()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE Matches 
                SET player1_score = ?, player2_score = ?, 
                    player3_score = ?, player4_score = ?
                WHERE match_id = ?
            """, (
                data['team1Score'], data['team1Score'],  # Both players in team 1 get same score
                data['team2Score'], data['team2Score'],  # Both players in team 2 get same score
                match_id
            ))
            conn.commit()
            return jsonify({"message": "Match updated successfully"})
    except Exception as e:
        print(f"Error updating match: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/static/avatars/<path:filename>')
def serve_avatar(filename):
    return send_from_directory('static/avatars', filename)

@app.route('/api/players/roster', methods=['GET'])
def get_player_roster():
    try:
        db = get_db()
        cur = db.cursor()
        
        cur.execute("""
            SELECT 
                p.player_id,
                p.name,
                p.role,
                COALESCE(ps.current_rating, 25.0) as rating,
                COALESCE(ps.wins, 0) as wins,
                COALESCE(ps.losses, 0) as losses
            FROM players p
            LEFT JOIN player_stats ps ON p.player_id = ps.player_id
            ORDER BY rating DESC
        """)
        
        players = cur.fetchall()
        return jsonify([dict(player) for player in players])
        
    except Exception as e:
        print(f"Error fetching player roster: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/players', methods=['POST'])
def add_player():
    try:
        data = request.json
        name = data.get('name')
        role = data.get('role')

        if not name or not role:
            return jsonify({"error": "Name and role are required"}), 400

        db = get_db()
        cur = db.cursor()
        
        # Check if player already exists
        cur.execute("SELECT player_id FROM players WHERE name = ?", (name,))
        if cur.fetchone():
            return jsonify({"error": "Player already exists"}), 400

        # Insert new player
        cur.execute(
            "INSERT INTO players (name, role) VALUES (?, ?)",
            (name, role)
        )
        db.commit()
        
        return jsonify({
            "message": "Player added successfully",
            "player": {
                "id": cur.lastrowid,
                "name": name,
                "role": role
            }
        }), 201

    except Exception as e:
        print(f"Error adding player: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/events', methods=['POST'])
def add_event():
    try:
        data = request.json
        title = data.get('title')
        location = data.get('location')
        type = data.get('type')
        description = data.get('description')
        date = data.get('date')

        if not all([title, location, date]):
            return jsonify({"error": "Title, location and date are required"}), 400

        db = get_db()
        cur = db.cursor()
        
        cur.execute("""
            INSERT INTO events (title, location, type, description, date)
            VALUES (?, ?, ?, ?, ?)
        """, (title, location, type, description, date))
        
        db.commit()
        
        return jsonify({
            "message": "Event added successfully",
            "event": {
                "id": cur.lastrowid,
                "title": title,
                "location": location,
                "type": type,
                "description": description,
                "date": date
            }
        }), 201

    except Exception as e:
        print(f"Error adding event: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        db = get_db()
        cur = db.cursor()
        
        cur.execute("""
            SELECT event_id, title, location, type, description, date
            FROM events
            ORDER BY date
        """)
        
        events = cur.fetchall()
        return jsonify([{
            'id': event['event_id'],
            'title': event['title'],
            'location': event['location'],
            'type': event['type'],
            'description': event['description'],
            'date': event['date']
        } for event in events])

    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        return jsonify({"error": str(e)}), 500

def process_unrated_matches():
    try:
        db = get_db()
        cur = db.cursor()
        
        # Convert date format and order by actual date
        cur.execute("""
            SELECT m.match_id, 
                   strftime('%Y-%m-%d', 
                           substr(m.match_date,7,4) || '-' || 
                           substr(m.match_date,4,2) || '-' || 
                           substr(m.match_date,1,2)) as date,
                   m.match_type,
                   m.player1_id, m.player2_id, m.player3_id, m.player4_id,
                   m.player1_score, m.player2_score, m.player3_score, m.player4_score
            FROM Matches m
            LEFT JOIN match_ratings mr ON m.match_id = mr.match_id
            WHERE mr.match_id IS NULL
            ORDER BY date ASC, m.match_id ASC
        """)
        
        unrated_matches = cur.fetchall()
        
        for match in unrated_matches:
            # Get current ratings for all players
            cur.execute("""
                SELECT player_id, current_rating, rating_deviation 
                FROM player_ratings 
                WHERE player_id IN (?, ?, ?, ?)
            """, (match['player1_id'], match['player2_id'], 
                 match['player3_id'], match['player4_id']))
            
            player_ratings = cur.fetchall()
            
            # If any player doesn't have a rating, initialize them
            existing_player_ids = [p['player_id'] for p in player_ratings]
            for player_id in [match['player1_id'], match['player2_id'], 
                            match['player3_id'], match['player4_id']]:
                if player_id not in existing_player_ids:
                    cur.execute("""
                        INSERT INTO player_ratings (player_id, current_rating, 
                                                  rating_deviation, last_updated)
                        VALUES (?, 25.0, 8.333333, ?)
                    """, (player_id, match['date']))
            
            # Get all ratings fresh after potential initialization
            cur.execute("""
                SELECT player_id, current_rating, rating_deviation 
                FROM player_ratings 
                WHERE player_id IN (?, ?, ?, ?)
            """, (match['player1_id'], match['player2_id'], 
                 match['player3_id'], match['player4_id']))
            
            ratings = {r['player_id']: Rating(r['current_rating'], r['rating_deviation']) 
                      for r in cur.fetchall()}
            
            # Calculate team ratings and win probability
            team1_rating = Rating(
                (ratings[match['player1_id']].mu + ratings[match['player2_id']].mu) / 2,
                (ratings[match['player1_id']].sigma**2 + ratings[match['player2_id']].sigma**2)**0.5
            )
            team2_rating = Rating(
                (ratings[match['player3_id']].mu + ratings[match['player4_id']].mu) / 2,
                (ratings[match['player3_id']].sigma**2 + ratings[match['player4_id']].sigma**2)**0.5
            )
            
            team1_win_prob = calculate_win_probability(team1_rating, team2_rating)
            
            # Determine match outcome and calculate MOV
            team1_score = (match['player1_score'] + match['player2_score']) / 2
            team2_score = (match['player3_score'] + match['player4_score']) / 2
            margin_of_victory = abs(team1_score - team2_score)
            mov_factor = margin_of_victory / (team1_score + team2_score) if (team1_score + team2_score) > 0 else 0
            
            team1_outcome = 1 if team1_score > team2_score else 2
            team2_outcome = 2 if team1_score > team2_score else 1
            
            # Calculate initial rating updates
            (new_p1, new_p2), (new_p3, new_p4) = rate(
                [(ratings[match['player1_id']], ratings[match['player2_id']]),
                 (ratings[match['player3_id']], ratings[match['player4_id']])],
                ranks=[team1_outcome, team2_outcome]
            )
            
            # Apply MOV adjustment
            new_p1 = Rating(
                new_p1.mu + (new_p1.mu - ratings[match['player1_id']].mu) * mov_factor,
                new_p1.sigma
            )
            new_p2 = Rating(
                new_p2.mu + (new_p2.mu - ratings[match['player2_id']].mu) * mov_factor,
                new_p2.sigma
            )
            new_p3 = Rating(
                new_p3.mu + (new_p3.mu - ratings[match['player3_id']].mu) * mov_factor,
                new_p3.sigma
            )
            new_p4 = Rating(
                new_p4.mu + (new_p4.mu - ratings[match['player4_id']].mu) * mov_factor,
                new_p4.sigma
            )
            
            # Store match ratings
            cur.execute("""
                INSERT INTO match_ratings (
                    match_id, date, match_type,
                    player1_id, player1_initial_rating, player1_new_rating, player1_rd, player1_rating_change,
                    player2_id, player2_initial_rating, player2_new_rating, player2_rd, player2_rating_change,
                    player3_id, player3_initial_rating, player3_new_rating, player3_rd, player3_rating_change,
                    player4_id, player4_initial_rating, player4_new_rating, player4_rd, player4_rating_change,
                    team1_score, team2_score, match_outcome,
                    team1_win_probability, team2_win_probability,
                    team1_rating, team1_rd, team2_rating, team2_rd,
                    margin_of_victory
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                match['match_id'], match['date'], match['match_type'],
                match['player1_id'], ratings[match['player1_id']].mu, new_p1.mu, new_p1.sigma, new_p1.mu - ratings[match['player1_id']].mu,
                match['player2_id'], ratings[match['player2_id']].mu, new_p2.mu, new_p2.sigma, new_p2.mu - ratings[match['player2_id']].mu,
                match['player3_id'], ratings[match['player3_id']].mu, new_p3.mu, new_p3.sigma, new_p3.mu - ratings[match['player3_id']].mu,
                match['player4_id'], ratings[match['player4_id']].mu, new_p4.mu, new_p4.sigma, new_p4.mu - ratings[match['player4_id']].mu,
                team1_score, team2_score, team1_outcome,
                team1_win_prob, 1 - team1_win_prob,
                team1_rating.mu, team1_rating.sigma, team2_rating.mu, team2_rating.sigma,
                margin_of_victory
            ))
            
            # Update player_ratings table
            for player_id, new_rating in [
                (match['player1_id'], new_p1),
                (match['player2_id'], new_p2),
                (match['player3_id'], new_p3),
                (match['player4_id'], new_p4)
            ]:
                cur.execute("""
                    UPDATE player_ratings 
                    SET current_rating = ?, 
                        rating_deviation = ?,
                        last_updated = ?
                    WHERE player_id = ?
                """, (new_rating.mu, new_rating.sigma, match['date'], player_id))
            
            db.commit()
            
        return True
        
    except Exception as e:
        print(f"Error processing ratings: {str(e)}")
        db.rollback()
        return False

# Add an endpoint to trigger the processing
@app.route('/api/ratings/process', methods=['POST'])
def process_ratings():
    success = process_unrated_matches()
    if success:
        return jsonify({"message": "Successfully processed ratings"}), 200
    return jsonify({"error": "Failed to process ratings"}), 500

@app.route('/api/ratings/backfill', methods=['POST'])
def backfill_ratings():
    try:
        success = process_unrated_matches()
        if success:
            return jsonify({"message": "Successfully processed all historical matches"}), 200
        return jsonify({"error": "Failed to process matches"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats/update', methods=['POST'])
def update_player_stats():
    try:
        db = get_db()
        cur = db.cursor()
        
        # First, insert entries for all players if they don't exist
        cur.execute("""
            INSERT OR REPLACE INTO player_stats 
                (player_id, current_rating, rating_deviation, matches_played, wins, losses, 
                 win_rate, rating_consistency, days_since_last_match, average_mov, average_mol, last_updated)
            SELECT 
                p.player_id,
                COALESCE(pr.current_rating, 25.0),
                COALESCE(pr.rating_deviation, 8.333333),
                (SELECT COUNT(*)
                 FROM match_ratings mr
                 WHERE mr.player1_id = p.player_id 
                    OR mr.player2_id = p.player_id
                    OR mr.player3_id = p.player_id
                    OR mr.player4_id = p.player_id),
                (SELECT COUNT(*)
                 FROM match_ratings mr
                 WHERE ((mr.player1_id = p.player_id OR mr.player2_id = p.player_id)
                       AND mr.match_outcome = 1)
                    OR ((mr.player3_id = p.player_id OR mr.player4_id = p.player_id)
                       AND mr.match_outcome = 2)),
                (SELECT COUNT(*)
                 FROM match_ratings mr
                 WHERE ((mr.player1_id = p.player_id OR mr.player2_id = p.player_id)
                       AND mr.match_outcome = 2)
                    OR ((mr.player3_id = p.player_id OR mr.player4_id = p.player_id)
                       AND mr.match_outcome = 1)),
                CASE 
                    WHEN (SELECT COUNT(*)
                          FROM match_ratings mr
                          WHERE mr.player1_id = p.player_id 
                             OR mr.player2_id = p.player_id
                             OR mr.player3_id = p.player_id
                             OR mr.player4_id = p.player_id) > 0 
                    THEN (
                        CAST((
                            SELECT COUNT(*)
                            FROM match_ratings mr
                            WHERE ((mr.player1_id = p.player_id OR mr.player2_id = p.player_id)
                                  AND mr.match_outcome = 1)
                               OR ((mr.player3_id = p.player_id OR mr.player4_id = p.player_id)
                                  AND mr.match_outcome = 2)
                        ) AS FLOAT) * 100.0 / 
                        (SELECT COUNT(*)
                         FROM match_ratings mr
                         WHERE mr.player1_id = p.player_id 
                            OR mr.player2_id = p.player_id
                            OR mr.player3_id = p.player_id
                            OR mr.player4_id = p.player_id)
                    )
                    ELSE 0
                END,
                (SELECT COALESCE(MAX(player_rating) - MIN(player_rating), 0)
                 FROM (
                     SELECT player1_new_rating as player_rating
                     FROM match_ratings
                     WHERE player1_id = p.player_id
                     UNION ALL
                     SELECT player2_new_rating
                     FROM match_ratings
                     WHERE player2_id = p.player_id
                     UNION ALL
                     SELECT player3_new_rating
                     FROM match_ratings
                     WHERE player3_id = p.player_id
                     UNION ALL
                     SELECT player4_new_rating
                     FROM match_ratings
                     WHERE player4_id = p.player_id
                 )),
                (SELECT COALESCE(CAST(julianday('now') - julianday(MAX(date)) AS INTEGER), 0)
                 FROM match_ratings
                 WHERE player1_id = p.player_id
                    OR player2_id = p.player_id
                    OR player3_id = p.player_id
                    OR player4_id = p.player_id),
                (SELECT COALESCE(AVG(margin_of_victory), 0)
                 FROM match_ratings mr
                 WHERE ((mr.player1_id = p.player_id OR mr.player2_id = p.player_id)
                       AND mr.match_outcome = 1)
                    OR ((mr.player3_id = p.player_id OR mr.player4_id = p.player_id)
                       AND mr.match_outcome = 2)),
                (SELECT COALESCE(AVG(margin_of_victory), 0)
                 FROM match_ratings mr
                 WHERE ((mr.player1_id = p.player_id OR mr.player2_id = p.player_id)
                       AND mr.match_outcome = 2)
                    OR ((mr.player3_id = p.player_id OR mr.player4_id = p.player_id)
                       AND mr.match_outcome = 1)),
                CURRENT_TIMESTAMP
            FROM players p
            LEFT JOIN player_ratings pr ON p.player_id = pr.player_id
        """)
        
        db.commit()
        
        # Verify the update
        cur.execute("SELECT COUNT(*) FROM player_stats WHERE current_rating != 25.0")
        updated_count = cur.fetchone()[0]
        print(f"Updated {updated_count} players with new statistics")
        
        # Update win streaks
        update_win_streaks()
        
        return jsonify({"message": f"Successfully updated {updated_count} player statistics"}), 200

    except Exception as e:
        print(f"Error updating stats: {str(e)}")
        db.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/players/stats', methods=['GET'])
def get_player_stats():
    try:
        db = get_db()
        cur = db.cursor()
        
        cur.execute("""
            SELECT 
                p.player_id,
                p.name,
                p.role,
                p.avatar_url,
                COALESCE(ps.current_rating, 25.0) as current_rating,
                COALESCE(ps.rating_deviation, 8.333333) as rating_deviation,
                COALESCE(ps.matches_played, 0) as matches_played,
                COALESCE(ps.wins, 0) as wins,
                COALESCE(ps.losses, 0) as losses,
                COALESCE(ps.win_rate, 0) as win_rate,
                ps.average_mov,
                ps.average_mol,
                COALESCE(ps.win_streak, 0) as win_streak
            FROM players p
            LEFT JOIN player_stats ps ON p.player_id = ps.player_id
            ORDER BY current_rating DESC
        """)
        
        players = cur.fetchall()
        return jsonify([dict(zip([
            'id', 'name', 'role', 'avatar_url',
            'current_rating', 'rating_deviation',
            'matches_played', 'wins', 'losses', 'win_rate', 'average_mov',
            'average_mol', 'win_streak'
        ], p)) for p in players])

    except Exception as e:
        print(f"Error fetching player stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ratings/history/update', methods=['POST'])
def update_rating_history():
    try:
        db = get_db()
        cur = db.cursor()
        
        # Clear existing history
        cur.execute("DELETE FROM player_rating_history")
        
        # Insert player1 ratings
        cur.execute("""
            INSERT INTO player_rating_history (player_id, rating, date, match_id)
            SELECT 
                player1_id,
                player1_new_rating,
                date,
                match_id
            FROM match_ratings
            ORDER BY date, match_id
        """)
        
        # Insert player2 ratings
        cur.execute("""
            INSERT INTO player_rating_history (player_id, rating, date, match_id)
            SELECT 
                player2_id,
                player2_new_rating,
                date,
                match_id
            FROM match_ratings
            ORDER BY date, match_id
        """)
        
        # Insert player3 ratings
        cur.execute("""
            INSERT INTO player_rating_history (player_id, rating, date, match_id)
            SELECT 
                player3_id,
                player3_new_rating,
                date,
                match_id
            FROM match_ratings
            ORDER BY date, match_id
        """)
        
        # Insert player4 ratings
        cur.execute("""
            INSERT INTO player_rating_history (player_id, rating, date, match_id)
            SELECT 
                player4_id,
                player4_new_rating,
                date,
                match_id
            FROM match_ratings
            ORDER BY date, match_id
        """)
        
        # Add initial ratings (25.0) for each player's first match
        cur.execute("""
            INSERT INTO player_rating_history (player_id, rating, date, match_id)
            SELECT DISTINCT
                p.player_id,
                25.0,
                (SELECT MIN(date)
                 FROM match_ratings mr
                 WHERE mr.player1_id = p.player_id 
                    OR mr.player2_id = p.player_id
                    OR mr.player3_id = p.player_id
                    OR mr.player4_id = p.player_id),
                (SELECT match_id
                 FROM match_ratings mr
                 WHERE (mr.player1_id = p.player_id 
                    OR mr.player2_id = p.player_id
                    OR mr.player3_id = p.player_id
                    OR mr.player4_id = p.player_id)
                 ORDER BY date, match_id
                 LIMIT 1)
            FROM players p
        """)
        
        db.commit()
        
        # Verify the update
        cur.execute("SELECT COUNT(*) FROM player_rating_history")
        history_count = cur.fetchone()[0]
        print(f"Added {history_count} rating history entries")
        
        return jsonify({"message": f"Successfully added {history_count} rating history entries"}), 200
        
    except Exception as e:
        print(f"Error updating rating history: {str(e)}")
        db.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/players/<int:player_id>/rating-history', methods=['GET'])
def get_player_rating_history(player_id):
    try:
        db = get_db()
        cur = db.cursor()
        
        cur.execute("""
            SELECT date, rating, match_id
            FROM player_rating_history
            WHERE player_id = ?
            ORDER BY date, match_id
        """, (player_id,))
        
        history = [{'date': row[0], 'rating': row[1]} for row in cur.fetchall()]
        return jsonify(history)
        
    except Exception as e:
        print(f"Error fetching rating history: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_matches_for_player(player_id):
    try:
        db = get_db()
        cur = db.cursor()
        
        cur.execute("""
            SELECT 
                match_id,
                match_date,
                player1_id, player2_id, player3_id, player4_id,
                player1_score, player2_score, player3_score, player4_score
            FROM matches 
            WHERE player1_id = ? 
               OR player2_id = ? 
               OR player3_id = ? 
               OR player4_id = ?
            ORDER BY match_id ASC
        """, (player_id, player_id, player_id, player_id))
        
        matches = cur.fetchall()
        
        # Calculate max win streak
        max_streak = 0
        current_streak = 0
        
        for match in matches:
            if match['player1_id'] == player_id or match['player2_id'] == player_id:
                player_team_score = match['player1_score'] + match['player2_score']
                opponent_team_score = match['player3_score'] + match['player4_score']
            else:
                player_team_score = match['player3_score'] + match['player4_score']
                opponent_team_score = match['player1_score'] + match['player2_score']
            
            if player_team_score > opponent_team_score:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
                
        return max_streak
        
    except Exception as e:
        print(f"Error getting matches for player {player_id}: {str(e)}")
        return 0

def update_win_streaks():
    try:
        db = get_db()
        cur = db.cursor()
        
        # Get all players
        cur.execute("SELECT player_id FROM players")
        players = cur.fetchall()
        
        # Update win streak for each player
        for player in players:
            max_streak = get_matches_for_player(player['player_id'])
            print(f"Updating player {player['player_id']} with win streak: {max_streak}")  # Debug line
            cur.execute("""
                UPDATE player_stats 
                SET win_streak = ? 
                WHERE player_id = ?
            """, (max_streak, player['player_id']))
            
        db.commit()  # Make sure changes are committed
        return True
        
    except Exception as e:
        print(f"Error updating win streaks: {str(e)}")
        db.rollback()
        return False

@app.route('/api/players/<int:player_id>/recent-matches', methods=['GET'])
def get_recent_matches(player_id):
    try:
        db = get_db()
        cur = db.cursor()
        
        params = tuple([player_id] * 6)
        
        cur.execute("""
            SELECT 
                m.match_date,
                p1.name AS player1_name,
                p2.name AS player2_name,
                p3.name AS player3_name,
                p4.name AS player4_name,
                m.player1_score AS team1_score,
                m.player3_score AS team2_score,
                CASE 
                    WHEN m.player1_id = ? OR m.player2_id = ? THEN 1
                    ELSE 2
                END AS player_team
            FROM matches m
            JOIN players p1 ON m.player1_id = p1.player_id
            JOIN players p2 ON m.player2_id = p2.player_id
            JOIN players p3 ON m.player3_id = p3.player_id
            JOIN players p4 ON m.player4_id = p4.player_id
            WHERE m.player1_id = ?
               OR m.player2_id = ?
               OR m.player3_id = ?
               OR m.player4_id = ?
            ORDER BY 
                substr(m.match_date, 7, 4) || '-' ||
                substr(m.match_date, 4, 2) || '-' ||
                substr(m.match_date, 1, 2) DESC,
                m.match_id DESC
            LIMIT 5
        """, params)
        
        matches = cur.fetchall()
        return jsonify([dict(match) for match in matches])
        
    except Exception as e:
        print(f"Error fetching recent matches: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Verify database exists
    if not os.path.exists(DATABASE):
        print(f"Database not found at: {DATABASE}")
    else:
        print(f"Database found at: {DATABASE}")
    app.run(host='0.0.0.0', port=5000, debug=True) 