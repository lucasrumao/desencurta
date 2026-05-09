/* ── SCROLL SUAVE COM HIGHLIGHT SIDEBAR ── */
    function scrollTo(id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      document.getElementById('nav-' + (id === 'privacidade' ? 'priv' : id === 'termos' ? 'termos' : 'contato'))?.classList.add('active');
    }

    /* Atualiza sidebar conforme scroll */
    const sections = ['privacidade', 'termos', 'contato'];
    const navIds   = { privacidade: 'nav-priv', termos: 'nav-termos', contato: 'nav-contato' };

    window.addEventListener('scroll', () => {
      let current = 'privacidade';
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
      });
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      document.getElementById(navIds[current])?.classList.add('active');
    });

    /* Abre na âncora correta se vier pelo URL */
    window.addEventListener('DOMContentLoaded', () => {
      const hash = location.hash.replace('#', '');
      if (hash && sections.includes(hash)) {
        setTimeout(() => scrollTo(hash), 100);
      }
    });

    /* ── FORMULÁRIO ── */
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function submitForm() {
      const name  = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const msg   = document.getElementById('form-msg').value.trim();

      if (!name || !email || !msg) {
        showToast('Preencha todos os campos.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('E-mail inválido.');
        return;
      }

      /* Aqui você pode integrar com um backend ou serviço como Formspree */
      /* Exemplo com Formspree: substitua ACTION pela sua URL */
      /* fetch('https://formspree.io/f/SEU_ID', { method:'POST', body: new FormData(form) }) */

      showToast('Mensagem enviada! Responderemos em breve. ✓');
      document.getElementById('form-name').value  = '';
      document.getElementById('form-email').value = '';
      document.getElementById('form-msg').value   = '';
    }