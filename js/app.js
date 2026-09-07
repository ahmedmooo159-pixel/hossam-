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
            title: 'صدقة جارية عن حسام حسني شكري',
            text: text + '\n\nهذا الدعاء صدقة جارية عن حسام حسني شكري. شاركنا الأجر.',
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
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const bookmarkBanner = document.getElementById('bookmark-banner');
  const bookmarkText = document.getElementById('bookmark-text');
  const gotoBookmarkBtn = document.getElementById('goto-bookmark-btn');

  let quranData = null;
  let currentOpenSurahId = null;

  // ---- Bookmark Logic ----
  function getBookmark() {
    const bm = localStorage.getItem('quranBookmark');
    return bm ? JSON.parse(bm) : null;
  }

  function saveBookmark(surahId, surahName) {
    const scrollY = window.scrollY;
    const bm = { surahId, surahName, scrollY };
    localStorage.setItem('quranBookmark', JSON.stringify(bm));
    showBookmarkSaved(surahName);
    updateBookmarkBanner();
  }

  function updateBookmarkBanner() {
    const bm = getBookmark();
    if (bm) {
      bookmarkText.innerText = `📌 آخر وقفة: سورة ${bm.surahName} — آية ${bm.ayahId}`;
      bookmarkBanner.style.display = 'flex';
    } else {
      bookmarkBanner.style.display = 'none';
    }
  }

  function showBookmarkSaved(ayahId) {
    const orig = bookmarkBtn.innerText;
    bookmarkBtn.innerText = `✅ آية ${ayahId} محفوظة`;
    bookmarkBtn.classList.add('btn-saved');
    setTimeout(() => {
      bookmarkBtn.innerText = orig;
      bookmarkBtn.classList.remove('btn-saved');
    }, 2500);
  }

  bookmarkBtn.addEventListener('click', () => {
    // Top button now shows bookmark info / clears bookmark
    const bm = getBookmark();
    if (bm) {
      if (confirm('هل تريد حذف العلامة المحفوظة؟')) {
        localStorage.removeItem('quranBookmark');
        updateBookmarkBanner();
        // Remove highlight from any ayah
        document.querySelectorAll('.ayah-number.bookmarked').forEach(el => el.classList.remove('bookmarked'));
        bookmarkBtn.innerText = '🔖 بدون علامة';
        setTimeout(() => { bookmarkBtn.innerText = '🔖 علامة'; }, 2000);
      }
    }
  });

  gotoBookmarkBtn.addEventListener('click', () => {
    const bm = getBookmark();
    if (!bm || !quranData) return;
    // If we're already in this surah, just scroll; else open it first
    if (currentOpenSurahId === bm.surahId) {
      scrollToAyah(bm.ayahId);
    } else {
      openSurah(bm.surahId);
      setTimeout(() => scrollToAyah(bm.ayahId), 300);
    }
  });

  function scrollToAyah(ayahId) {
    const el = document.querySelector(`.ayah-number[data-ayah="${ayahId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
      el.classList.add('bookmarked', 'ayah-flash');
      setTimeout(() => el.classList.remove('ayah-flash'), 1500);
    }
  }

  async function loadQuran() {
    try {
      const response = await fetch('./data/quran/quran.json');
      if (!response.ok) throw new Error('Network response was not ok');
      quranData = await response.json();
      renderSurahList();
      setupIndexControls();
    } catch (error) {
      document.getElementById('surah-grid').innerHTML = '<p style="text-align: center; color: red;">عذراً، حدث خطأ أثناء تحميل المصحف الشريف.</p>';
      console.error('Quran loading error:', error);
    }
  }

  function renderSurahList(filter = 'all', query = '') {
    if (!quranData) return;
    const surahGrid = document.getElementById('surah-grid');

    const filtered = quranData.filter(surah => {
      const matchesType = filter === 'all' ||
        (filter === 'meccan' && surah.type === 'meccan') ||
        (filter === 'medinan' && surah.type === 'medinan');
      const matchesQuery = query === '' ||
        surah.name.includes(query) ||
        surah.transliteration.toLowerCase().includes(query.toLowerCase()) ||
        String(surah.id).includes(query);
      return matchesType && matchesQuery;
    });

    if (filtered.length === 0) {
      surahGrid.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">لا توجد نتائج</p>';
      return;
    }

    let html = '<div class="surah-list">';
    filtered.forEach(surah => {
      const typeLabel = surah.type === 'meccan' ? 'مكية' : 'مدنية';
      const typeClass = surah.type === 'meccan' ? 'type-meccan' : 'type-medinan';
      html += `
        <div class="surah-item" data-id="${surah.id}">
          <div class="surah-num-badge">${surah.id}</div>
          <div class="surah-info">
            <div class="surah-name">${surah.name}</div>
            <div class="surah-meta">
              <span class="surah-type ${typeClass}">${typeLabel}</span>
              <span class="surah-verses">${surah.total_verses} آية</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    surahGrid.innerHTML = html;

    document.querySelectorAll('.surah-item').forEach(item => {
      item.addEventListener('click', () => {
        const surahId = parseInt(item.getAttribute('data-id'));
        openSurah(surahId);
      });
    });
  }

  // Search & filter logic
  let currentFilter = 'all';
  let currentQuery = '';

  function setupIndexControls() {
    const searchInput = document.getElementById('surah-search');
    const filterTabs = document.querySelectorAll('.filter-tab');

    searchInput.addEventListener('input', () => {
      currentQuery = searchInput.value.trim();
      renderSurahList(currentFilter, currentQuery);
    });

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter');
        renderSurahList(currentFilter, currentQuery);
      });
    });
  }

  function openSurah(surahId) {
    const surah = quranData.find(s => s.id === surahId);
    if (!surah) return;

    currentOpenSurahId = surahId;
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
      versesHtml += `${verse.text} <span class="ayah-number" data-ayah="${verse.id}" title="اضغط لتعليم وقفتك عند هذه الآية">${verse.id}</span> `;
    });

    quranContent.innerHTML = versesHtml;

    // Attach bookmark click on each ayah number
    const bm = getBookmark();
    document.querySelectorAll('.ayah-number').forEach(el => {
      const ayahId = parseInt(el.getAttribute('data-ayah'));

      // Restore saved bookmark highlight
      if (bm && bm.surahId === surahId && bm.ayahId === ayahId) {
        el.classList.add('bookmarked');
      }

      el.addEventListener('click', () => {
        // Remove highlight from all, then mark this one
        document.querySelectorAll('.ayah-number.bookmarked').forEach(x => x.classList.remove('bookmarked'));
        el.classList.add('bookmarked');

        // Save to localStorage
        const bm = { surahId, surahName: surah.name, ayahId };
        localStorage.setItem('quranBookmark', JSON.stringify(bm));
        showBookmarkSaved(ayahId);
        updateBookmarkBanner();
      });
    });

    quranContainer.style.display = 'none';
    quranReader.classList.add('active');
    
    // Show bookmark banner if there's a saved bookmark
    updateBookmarkBanner();
    
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
