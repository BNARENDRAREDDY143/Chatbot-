import os
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from dotenv import load_dotenv
from college_data import college_data

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configurations
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'lara_college.db')}")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'lara_college_secret_jwt_key_2026_flask')

db = SQLAlchemy(app)

# ----------------- Database Models -----------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(100), default='')
    register_number = db.Column(db.String(100), default='')
    role = db.Column(db.String(50), default='student')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'department': self.department,
            'registerNumber': self.register_number,
            'role': self.role,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    session_id = db.Column(db.String(100), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    reply = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='general')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'sessionId': self.session_id,
            'message': self.message,
            'reply': self.reply,
            'category': self.category,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class Enquiry(db.Model):
    __tablename__ = 'enquiries'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    course_of_interest = db.Column(db.String(100), default='General')
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'courseOfInterest': self.course_of_interest,
            'message': self.message,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class KnowledgeBase(db.Model):
    __tablename__ = 'knowledge_base'
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    question = db.Column(db.String(255), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    keywords = db.Column(db.Text, default='') # comma-separated
    priority = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'question': self.question,
            'answer': self.answer,
            'keywords': [k.strip() for k in self.keywords.split(',')] if self.keywords else [],
            'priority': self.priority
        }

# ----------------- JWT Helper & Decorators -----------------
def generate_token(user_id, email, role='student'):
    payload = {
        'id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Authorization token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['id'])
            if not current_user:
                return jsonify({'message': 'User not found or invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired, please log in again'}), 401
        except Exception:
            return jsonify({'message': 'Invalid authorization token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                current_user = User.query.get(data['id'])
            except Exception:
                current_user = None
        return f(current_user, *args, **kwargs)
    return decorated

# ----------------- NLP / Knowledge Base Search Engine -----------------
def find_best_college_answer(user_query):
    query_lower = user_query.lower().strip()
    words = [w for w in query_lower.split() if len(w) > 2]
    
    # Check database knowledge base or fallback to college_data
    kb_items = KnowledgeBase.query.all()
    source_items = [item.to_dict() for item in kb_items] if kb_items else college_data
    
    best_match = None
    highest_score = 0.0
    
    for item in source_items:
        score = 0.0
        # Keywords match
        for kw in item.get('keywords', []):
            if kw.lower() in query_lower:
                score += 3.0
            for word in words:
                if word in kw.lower():
                    score += 1.5
                    
        # Question similarity
        if item.get('question', '').lower() in query_lower:
            score += 5.0
        for word in words:
            if word in item.get('question', '').lower():
                score += 1.0
                
        # Priority weight
        score += item.get('priority', 1) * 0.2
        
        if score > highest_score:
            highest_score = score
            best_match = item
            
    if best_match and highest_score >= 1.5:
        return {
            'reply': best_match['answer'],
            'category': best_match.get('category', 'general')
        }
        
    return {
        'reply': "I can help you with admissions, courses (CSE, AI&ML, Data Science, ECE, ME, CE), fee structures, placement statistics (85%+ placed, highest ₹24 LPA), hostel accommodations, bus transport routes, and contact details for **Vignan's Lara Institute of Technology & Science**.\n\nCould you please specify your query or contact the admissions desk at **+91-863-2381200** / **admissions@vignanlara.org**?",
        'category': 'general'
    }

# ----------------- Routes -----------------

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'service': 'Lara College Chatbot Python Flask API',
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    department = data.get('department', '').strip()
    register_number = data.get('registerNumber', '').strip()
    
    if not username or not email or not password:
        return jsonify({'message': 'Please provide username, email, and password'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User with this email already exists'}), 400
    
    new_user = User(
        username=username,
        email=email,
        department=department,
        register_number=register_number
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    token = generate_token(new_user.id, new_user.email, new_user.role)
    return jsonify({
        'success': True,
        'token': token,
        'user': new_user.to_dict()
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'message': 'Please provide email and password'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    token = generate_token(user.id, user.email, user.role)
    return jsonify({
        'success': True,
        'token': token,
        'user': user.to_dict()
    })

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'success': True,
        'user': current_user.to_dict()
    })

@app.route('/api/auth/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    if 'username' in data:
        current_user.username = data['username']
    if 'email' in data:
        current_user.email = data['email'].strip().lower()
    if 'department' in data:
        current_user.department = data['department']
    if 'registerNumber' in data:
        current_user.register_number = data['registerNumber']
        
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'user': current_user.to_dict()
    })

# Chat Routes
@app.route('/api/chat', methods=['POST'])
@optional_token
def handle_chat(current_user):
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    session_id = data.get('sessionId') or (str(current_user.id) if current_user else 'guest-session')
    
    if not message:
        return jsonify({'message': 'Message is required'}), 400
        
    res = find_best_college_answer(message)
    reply = res['reply']
    category = res['category']
    
    chat_msg = ChatMessage(
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        message=message,
        reply=reply,
        category=category
    )
    db.session.add(chat_msg)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'reply': reply,
        'category': category,
        'chatId': str(chat_msg.id),
        'createdAt': chat_msg.created_at.isoformat()
    })

@app.route('/api/chat/history', methods=['GET'])
@optional_token
def get_history(current_user):
    session_id = request.args.get('sessionId')
    if current_user:
        messages = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    elif session_id:
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.desc()).limit(50).all()
    else:
        return jsonify({'success': True, 'history': []})
        
    return jsonify({
        'success': True,
        'history': [m.to_dict() for m in messages]
    })

@app.route('/api/chat/history', methods=['DELETE'])
@token_required
def clear_history(current_user):
    ChatMessage.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'success': True, 'message': 'Chat history cleared successfully'})

# FAQ Routes
@app.route('/api/faq', methods=['GET'])
def get_faqs():
    category = request.args.get('category', 'all')
    search = request.args.get('search', '').lower().strip()
    
    query = KnowledgeBase.query
    if category != 'all':
        query = query.filter_by(category=category)
    faqs = query.order_by(KnowledgeBase.priority.desc()).all()
    
    results = [f.to_dict() for f in faqs]
    if not results:
        results = [item for item in college_data if category == 'all' or item.get('category') == category]
        
    if search:
        results = [
            item for item in results 
            if search in item.get('question', '').lower() 
            or search in item.get('answer', '').lower()
            or any(search in kw.lower() for kw in item.get('keywords', []))
        ]
        
    return jsonify({
        'success': True,
        'count': len(results),
        'data': results
    })

# Enquiry Route
@app.route('/api/enquiry', methods=['POST'])
def submit_enquiry():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    message = data.get('message', '').strip()
    course_of_interest = data.get('courseOfInterest', 'General')
    
    if not all([name, email, phone, message]):
        return jsonify({'message': 'Please provide name, email, phone, and your query/message.'}), 400
        
    enquiry = Enquiry(
        name=name,
        email=email,
        phone=phone,
        course_of_interest=course_of_interest,
        message=message
    )
    db.session.add(enquiry)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Thank you for your enquiry. The Lara Admissions cell will contact you shortly!',
        'data': enquiry.to_dict()
    }), 201

# Auto-initialize DB & seed
with app.app_context():
    db.create_all()
    if KnowledgeBase.query.count() == 0:
        for item in college_data:
            kb = KnowledgeBase(
                category=item.get('category', 'general'),
                question=item.get('question', ''),
                answer=item.get('answer', ''),
                keywords=','.join(item.get('keywords', [])),
                priority=item.get('priority', 1)
            )
            db.session.add(kb)
        db.session.commit()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f">> Lara College Python Flask Backend Server running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
