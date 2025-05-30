// public/js/posts.js
async function uploadPostWithImage() {
    const formData = new FormData();
    formData.append('image', document.getElementById('post-image').files[0]);
    formData.append('content', document.getElementById('post-content').value);
  
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  
    return await response.json();
  }
  import { fetchPosts, createPost } from './api.js';

async function loadPosts() {
  const posts = await fetchPosts();
  const container = document.getElementById('posts-container');
  
  posts.forEach(post => {
    container.innerHTML += `
      <div class="post-box">
        <div class="post-header">
          <img src="${post.user.profileImage}" class="post-avatar">
          <h4>${post.user.name}</h4>
        </div>
        <div class="post-content">${post.content}</div>
      </div>
    `;
  });
}

document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('post-content').value;
  await createPost({ content });
  loadPosts(); // Refresh posts
});

// Load posts on page load
document.addEventListener('DOMContentLoaded', loadPosts);