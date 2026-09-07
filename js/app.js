document.addEventListener('DOMContentLoaded', () => {
  // Navigation Logic
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      navBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Add active to clicked
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Dua Sharing and Copying
  const duaCards = document.querySelectorAll('#dua-section .card');
  duaCards.forEach(card => {
    const text = card.querySelector('.dua-text').innerText;
    const shareBtn = card.querySelector('.share-btn');
    const copyBtn = card.querySelector('.copy-btn');

    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'صدقة جارية عن حسام حسن شكري',
            text: text + '\n\nهذا الدعاء صدقة جارية عن حسام حسن شكري. شاركنا الأجر.',
          });
        } catch (err) {
          console.error('Share failed:', err);
        }
      } else {
        alert('ميزة المشاركة غير مدعومة في متصفحك.');
      }
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'تم النسخ!';
        setTimeout(() => copyBtn.innerText = originalText, 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    });
  });

  // Tasbeeh Logic
  const tasbeehBtn = document.getElementById('tasbeeh-btn');
  const innerCircle = tasbeehBtn.querySelector('.inner-circle');
  const tasbeehSelector = document.getElementById('tasbeeh-selector');
  const tasbeehReset = document.getElementById('tasbeeh-reset');
  
  let count = parseInt(localStorage.getItem('tasbeehCount')) || 0;
  innerCircle.innerText = count;

  tasbeehBtn.addEventListener('click', () => {
    count++;
    localStorage.setItem('tasbeehCount', count);
    innerCircle.innerText = count;
  });

  tasbeehReset.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من تصفير العداد؟')) {
      count = 0;
      localStorage.setItem('tasbeehCount', count);
      innerCircle.innerText = count;
    }
  });

  // Quran Logic
  const quranContainer = document.getElementById('surah-list-container');
  const quranReader = document.getElementById('quran-reader');
  const backToSurahsBtn = document.getElementById('back-to-surahs');
  const quranContent = document.getElementById('quran-content');
  const readerSurahTitle = document.getElementById('reader-surah-title');
  const bismillah = document.getElementById('bismillah');

  let quranData = null;

  async function loadQuran() {
    try {
      const response = await fetch('./data/quran/quran.json');
      if (!response.ok) throw new Error('Network response was not ok');
      quranData = await response.json();
      renderSurahList();
    } catch (error) {
      quranContainer.innerHTML = '<p style="text-align: center; color: red;">عذراً، حدث خطأ أثناء تحميل المصحف الشريف. تأكد من أنك قمت بفتح التطبيق لمرة واحدة على الأقل بوجود إنترنت.</p>';
      console.error('Quran loading error:', error);
    }
  }

  function renderSurahList() {
    if (!quranData) return;
    
    let html = '<div class="surah-list">';
    quranData.forEach(surah => {
      html += `
        <div class="surah-item" data-id="${surah.id}">
          <div class="surah-number">${surah.id}</div>
          <div class="surah-name">${surah.name}</div>
        </div>
      `;
    });
    html += '</div>';
    quranContainer.innerHTML = html;

    // Attach click events
    document.querySelectorAll('.surah-item').forEach(item => {
      item.addEventListener('click', () => {
        const surahId = parseInt(item.getAttribute('data-id'));
        openSurah(surahId);
      });
    });
  }

  function openSurah(surahId) {
    const surah = quranData.find(s => s.id === surahId);
    if (!surah) return;

    readerSurahTitle.innerText = 'سورة ' + surah.name;
    
    // Hide Bismillah for Tawbah (Surah 9)
    if (surahId === 9) {
      bismillah.style.display = 'none';
    } else {
      bismillah.style.display = 'block';
    }
    
    // For Fatiha, the Bismillah is verse 1. So we shouldn't show the header bismillah to avoid duplication
    if (surahId === 1) {
      bismillah.style.display = 'none'; 
    }

    let versesHtml = '';
    surah.verses.forEach(verse => {
      versesHtml += `${verse.text} <span class="ayah-number">${verse.id}</span> `;
    });

    quranContent.innerHTML = versesHtml;
    
    quranContainer.style.display = 'none';
    quranReader.classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
  }

  backToSurahsBtn.addEventListener('click', () => {
    quranReader.classList.remove('active');
    quranContainer.style.display = 'block';
  });

  // Initialize Quran
  loadQuran();
});
