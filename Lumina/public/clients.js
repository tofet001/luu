document.addEventListener('DOMContentLoaded', () => {
    // State management
    let currentUser = null;
    let authToken = localStorage.getItem('token');
    const apiUrl = 'http://localhost:5000/api';
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const postForm = document.getElementById('postForm');
    const prayerForm = document.getElementById('prayerForm');
    const callButtons = document.querySelectorAll('.call-btn');
    
    // Initialize Socket.io connection
    const socket = io('http://localhost:5000');
    
    // Authentication Functions
    async function loginUser(email, password) {
        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                authToken = data.token;
                currentUser = await getCurrentUser();
                setupUI();
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
        }
    }
    
    async function registerUser(userData) {
        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
        }
    }
    
    async function getCurrentUser() {
        try {
            const response = await fetch(`${apiUrl}/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch user:', error);
            return null;
        }
    }
    
    // Content Management
    async function loadPosts() {
        try {
            const response = await fetch(`${apiUrl}/posts`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            console.error('Failed to load posts:', error);
        }
    }
    
    function renderPosts(posts) {
        const feedContainer = document.querySelector('.main-content');
        feedContainer.innerHTML = posts.map(post => `
            <div class="post-box" data-id="${post._id}">
                <div class="post-header">
                    <div class="post-avatar" style="background-image: url('${post.user.avatar || 'https://i.pravatar.cc/150?img=3'}')"></div>
                    <div class="post-user-info">
                        <h4>${post.user.name}</h4>
                        <p>@${post.user.username} · ${new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                    ${post.scripture ? `
                    <div class="verse-highlight">
                        "${post.scripture.text}"
                        <span class="verse-reference">${post.scripture.reference}</span>
                    </div>` : ''}
                </div>
                <div class="post-actions">
                    <div class="post-action like-btn">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes || 0}</span>
                    </div>
                    <div class="post-action comment-btn">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments?.length || 0}</span>
                    </div>
                    <div class="post-action pray-btn">
                        <i class="fas fa-hands-praying"></i>
                        <span class="prayed-count">${post.prayers?.length || 0} prayed</span>
                    </div>
                    <div class="post-action">
                        <i class="fas fa-share"></i>
                        <span>Share</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to interactive elements
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', handleLike);
        });
        
        document.querySelectorAll('.pray-btn').forEach(btn => {
            btn.addEventListener('click', handlePray);
        });
    }
    
    // Event Handlers
    async function handleLike(e) {
        const postId = e.target.closest('.post-box').dataset.id;
        try {
            const response = await fetch(`${apiUrl}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const updatedPost = await response.json();
            updatePostUI(updatedPost);
        } catch (error) {
            console.error('Like error:', error);
        }
    }
    
    async function handlePray(e) {
        const postId = e.target.closest('.post-box').dataset.id;
        try {
            const response = await fetch(`${apiUrl}/posts/${postId}/pray`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const updatedPost = await response.json();
            updatePostUI(updatedPost);
        } catch (error) {
            console.error('Pray error:', error);
        }
    }
    
    function updatePostUI(post) {
        const postElement = document.querySelector(`.post-box[data-id="${post._id}"]`);
        if (postElement) {
            postElement.querySelector('.like-btn span').textContent = post.likes || 0;
            postElement.querySelector('.pray-btn .prayed-count').textContent = 
                `${post.prayers?.length || 0} prayed`;
        }
    }
    
    // Real-time Communication
    socket.on('newPost', (post) => {
        // Prepend new post to feed
        const feedContainer = document.querySelector('.main-content');
        const firstPost = feedContainer.firstChild;
        feedContainer.insertBefore(createPostElement(post), firstPost);
    });
    
    socket.on('postUpdated', (updatedPost) => {
        updatePostUI(updatedPost);
    });
    
    socket.on('newPrayerRequest', (prayer) => {
        showNotification(`New prayer request: ${prayer.content.substring(0, 50)}...`);
    });
    
    // UI Setup
    function setupUI() {
        if (currentUser) {
            // Show authenticated UI
            document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
            
            // Set user avatar
            const avatars = document.querySelectorAll('.user-avatar, .post-avatar');
            avatars.forEach(avatar => {
                avatar.style.backgroundImage = `url('${currentUser.avatar || 'https://i.pravatar.cc/150?img=3'}')`;
            });
            
            // Load initial data
            loadPosts();
            loadPrayerRequests();
            loadEvents();
        } else {
            // Show guest UI
            document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
        }
    }
    
    // Form Event Listeners
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            await loginUser(email, password);
        });
    }
    
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = postForm.querySelector('textarea').value;
            const scripture = postForm.querySelector('input[name="scripture"]').value;
            
            try {
                const response = await fetch(`${apiUrl}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ 
                        content,
                        scripture: scripture ? {
                            text: scripture.split('|')[0],
                            reference: scripture.split('|')[1]
                        } : null
                    })
                });
                
                const newPost = await response.json();
                postForm.reset();
                socket.emit('newPost', newPost);
            } catch (error) {
                console.error('Post creation error:', error);
            }
        });
    }
    
    // Initialize app
    async function init() {
        if (authToken) {
            currentUser = await getCurrentUser();
        }
        setupUI();
    }
    
    init();
});