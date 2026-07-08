/**
 * SIMPAH Searchable Select Dropdown Helper
 * Provides modern searchable select functionality for Kecamatan and Desa inputs.
 */

export function wireSearchableSelect({
  inputEl,
  dropdownEl,
  hiddenEl,
  feedbackEl,
  getOptions, // Function returning array of { value, label }
  onSelect = () => {},
  onClear = () => {},
  required = false
}) {
  let activeIndex = -1;
  let filteredOptions = [];

  const getFiltered = (filterText = '') => {
    const opts = getOptions() || [];
    return opts.filter(opt =>
      opt.label.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  const renderOptions = (filterText = '') => {
    filteredOptions = getFiltered(filterText);

    if (filteredOptions.length === 0) {
      dropdownEl.innerHTML = '<div class="custom-select-no-results">Data tidak ditemukan</div>';
      activeIndex = -1;
      return;
    }

    dropdownEl.innerHTML = filteredOptions.map((opt, index) => {
      const isSelected = hiddenEl.value === opt.value;
      const isActive = index === activeIndex;
      return `
        <div class="custom-select-option ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}" 
             data-value="${opt.value}" 
             data-index="${index}"
             style="${isActive ? 'background: rgba(16, 185, 129, 0.08);' : ''}">
          ${opt.label}
        </div>
      `;
    }).join('');
  };

  const openDropdown = () => {
    if (inputEl.disabled) return;
    // Close other open custom selects
    document.querySelectorAll('.custom-select-dropdown').forEach(d => {
      if (d !== dropdownEl) d.style.display = 'none';
    });
    
    renderOptions(inputEl.value);
    dropdownEl.style.display = 'block';
    inputEl.closest('.custom-select-container')?.classList.add('open');
  };

  const closeDropdown = () => {
    dropdownEl.style.display = 'none';
    inputEl.closest('.custom-select-container')?.classList.remove('open');
    activeIndex = -1;
  };

  const selectIndex = (index) => {
    if (index >= 0 && index < filteredOptions.length) {
      const opt = filteredOptions[index];
      const changed = hiddenEl.value !== opt.value;
      inputEl.value = opt.label;
      hiddenEl.value = opt.value;
      inputEl.style.borderColor = 'var(--border-color)';
      if (feedbackEl) feedbackEl.style.display = 'none';
      closeDropdown();
      if (changed) {
        onSelect(opt);
      }
    }
  };

  const scrollActiveIntoView = () => {
    const activeEl = dropdownEl.querySelector('.custom-select-option.active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (dropdownEl.style.display === 'none') {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        openDropdown();
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      activeIndex = (activeIndex + 1) % filteredOptions.length;
      renderOptions(inputEl.value);
      scrollActiveIntoView();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      activeIndex = (activeIndex - 1 + filteredOptions.length) % filteredOptions.length;
      renderOptions(inputEl.value);
      scrollActiveIntoView();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        selectIndex(activeIndex);
      } else if (filteredOptions.length > 0) {
        selectIndex(0);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      closeDropdown();
      e.preventDefault();
    }
  };

  inputEl.addEventListener('focus', openDropdown);
  inputEl.addEventListener('click', openDropdown);
  inputEl.addEventListener('keydown', handleKeyDown);
  
  inputEl.addEventListener('input', () => {
    activeIndex = -1; // reset active option
    openDropdown();
    
    // Validate inline if typing matches exactly
    const typed = inputEl.value.trim();
    const match = getOptions().find(opt => opt.label.toLowerCase() === typed.toLowerCase());
    if (match) {
      const changed = hiddenEl.value !== match.value;
      hiddenEl.value = match.value;
      inputEl.style.borderColor = 'var(--border-color)';
      if (feedbackEl) feedbackEl.style.display = 'none';
      if (changed) {
        onSelect(match);
      }
    } else {
      const wasNotEmpty = hiddenEl.value !== '';
      hiddenEl.value = '';
      if (wasNotEmpty) {
        onClear();
      }
    }
  });

  // Click option
  dropdownEl.addEventListener('click', (e) => {
    const optEl = e.target.closest('.custom-select-option');
    if (!optEl) return;
    
    const index = parseInt(optEl.dataset.index, 10);
    selectIndex(index);
  });

  // Click outside to close and validate
  const handleClickOutside = (e) => {
    const container = inputEl.closest('.custom-select-container');
    if (container && !container.contains(e.target)) {
      closeDropdown();

      const typed = inputEl.value.trim();
      if (!typed) {
        const wasNotEmpty = hiddenEl.value !== '';
        inputEl.style.borderColor = 'var(--border-color)';
        if (feedbackEl) feedbackEl.style.display = 'none';
        hiddenEl.value = '';
        if (wasNotEmpty) {
          onClear();
        }
        return;
      }

      const match = getOptions().find(opt => opt.label.toLowerCase() === typed.toLowerCase());
      if (match) {
        const changed = hiddenEl.value !== match.value;
        inputEl.value = match.label; // Normalise casing
        hiddenEl.value = match.value;
        inputEl.style.borderColor = 'var(--border-color)';
        if (feedbackEl) feedbackEl.style.display = 'none';
        if (changed) {
          onSelect(match);
        }
      } else {
        const wasNotEmpty = hiddenEl.value !== '';
        inputEl.style.borderColor = '#ef4444';
        if (feedbackEl) feedbackEl.style.display = 'block';
        hiddenEl.value = '';
        if (wasNotEmpty) {
          onClear();
        }
      }
    }
  };

  document.addEventListener('click', handleClickOutside);

  return {
    destroy: () => {
      document.removeEventListener('click', handleClickOutside);
    },
    validate: () => {
      const typed = inputEl.value.trim();
      if (required && !typed) {
        inputEl.style.borderColor = '#ef4444';
        if (feedbackEl) feedbackEl.style.display = 'block';
        return false;
      }
      
      const match = getOptions().find(opt => opt.label.toLowerCase() === typed.toLowerCase());
      if (typed && !match) {
        inputEl.style.borderColor = '#ef4444';
        if (feedbackEl) feedbackEl.style.display = 'block';
        return false;
      }
      return true;
    }
  };
}
