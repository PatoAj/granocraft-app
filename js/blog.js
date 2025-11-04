// GranoCraft/js/blog.js

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('posts-grid');
    const fullPostModal = document.getElementById('fullPostModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const modalTitle = document.getElementById('modal-post-title');
    const modalMeta = document.getElementById('modal-post-meta');
    const modalImage = document.getElementById('modal-post-image');
    const modalBody = document.getElementById('modal-post-body');

    if (!postsGrid) return;

    const formatDate = (d) => new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

    // --- FUNCIÓN DE TARJETA ---
    function createPostCard(post) {
        let imageUrl = post.imageUrl 
            ? `/${post.imageUrl}` 
            : 'https://via.placeholder.com/300x200/A18A76/FFFFFF?text=GranoCraft+Blog';

        const excerpt = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');

        // Usar el nombre público del autor
        const authorName = post.author ? (post.author.producerNamePublic || post.author.email) : 'Administrador';

        return `
            <div class="card post-card" data-id="${post._id}" style="cursor: pointer;">
                <img src="${imageUrl}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column;">
                    <h3 style="color: #3C2A21; margin-bottom: 5px; font-size: 1.3em;">${post.title}</h3>
                    <p style="font-size: 0.85em; color: #888; margin-bottom: 10px;">
                        Por ${authorName} | ${formatDate(post.createdAt)}
                    </p>
                    <p style="flex-grow: 1;">${excerpt}</p>
                    <button class="read-more-btn" data-id="${post._id}" style="color: #8a5a44; font-weight: bold; margin-top: 15px; text-align: left; background: none; border: none; padding: 0;">Leer más →</button>
                </div>
            </div>
        `;
    }

    // --- FUNCIÓN DEL MODAL ---
    async function loadFullPost(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const post = await response.json();
            
            const imageUrl = post.imageUrl ? `/${post.imageUrl}` : '';
            
            // Usar el nombre público del autor
            const authorName = post.author ? (post.author.producerNamePublic || post.author.email) : 'Administrador';

            modalTitle.textContent = post.title;
            modalMeta.textContent = `Publicado el ${formatDate(post.createdAt)} por ${authorName}`;
            
            if (imageUrl) {
                modalImage.src = imageUrl;
                modalImage.style.display = 'block';
            } else {
                modalImage.style.display = 'none';
            }
            
            modalBody.textContent = post.content;
            
            fullPostModal.style.display = 'flex'; 
            document.body.style.overflow = 'hidden'; 
        } catch (error) {
            console.error('Error al cargar post completo:', error);
            alert('No se pudo cargar el contenido completo del post.');
        }
    }


    // --- FUNCIÓN PRINCIPAL ---
    async function fetchPosts() {
        postsGrid.innerHTML = '<p style="text-align: center; width: 100%;">Cargando entradas del blog...</p>';
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const posts = await response.json();

            if (posts.length === 0) {
                postsGrid.innerHTML = '<p style="text-align: center; width: 100%;">Aún no hay publicaciones en el blog.</p>';
                return;
            }

            postsGrid.innerHTML = posts.map(createPostCard).join('');

            postsGrid.querySelectorAll('.post-card').forEach(element => {
                element.addEventListener('click', (e) => {
                    const postId = e.currentTarget.getAttribute('data-id');
                    if (postId) loadFullPost(postId);
                });
            });


        } catch (error) {
            console.error("Fallo al obtener los posts:", error);
            postsGrid.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Error al cargar el blog. Asegúrese que el servidor esté activo.</p>';
        }
    }

    // Configurar el cierre del modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            fullPostModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === fullPostModal) {
            fullPostModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    fetchPosts();
});