/* ShelfGenie concept interactions. This preview never transmits or saves form data. */
(() => {
  'use strict';

  const PROJECTS = {
    kitchen: {
      title: 'A kitchen that works beautifully.',
      eyebrow: 'CUSTOM PULL-OUT SHELVES',
      description: 'Bring the contents of your cabinets into view with storage designed around your space and the way you cook. ShelfGenie custom pull-outs fit your existing cabinets.',
      image: 'assets/hero-kitchen.webp',
      alt: 'ShelfGenie pull-out shelves fitted into a kitchen cabinet.',
      features: ['Custom fit for existing cabinetry', 'Solutions for cookware, bakeware and everyday essentials', 'Professional design and installation']
    },
    pantry: {
      title: 'Every ingredient, within reach.',
      eyebrow: 'PERSONALIZED PANTRY STORAGE',
      description: 'Give groceries, small appliances and everyday essentials a considered place. A ShelfGenie designer can help you explore storage for your pantry layout.',
      image: 'assets/pantry.webp',
      alt: 'A pantry organized with ShelfGenie storage solutions.',
      features: ['Storage planned around what you keep', 'Custom pull-out shelving options', 'Solutions for cabinet and walk-in pantries']
    },
    closets: {
      title: 'A more personal dressing space.',
      eyebrow: 'CUSTOM CLOSET SYSTEMS',
      description: 'Create a closet that reflects your routines and your sense of style. Explore a personalized combination of shelving, drawers, hanging space and finishes with your designer.',
      image: 'assets/premium-closet.webp',
      alt: 'A custom ShelfGenie closet with thoughtfully arranged storage.',
      features: ['A layout designed around your wardrobe', 'Personalized finishes and accessories', '3D design collaboration; local availability varies']
    },
    bathroom: {
      title: 'A calmer start to every day.',
      eyebrow: 'BATHROOM STORAGE',
      description: 'Make room for the things that make your routine yours. Custom storage can help organize vanity cabinets and bring everyday essentials within easier reach.',
      image: 'assets/bathroom.webp',
      alt: 'ShelfGenie storage organized inside a bathroom vanity.',
      features: ['Custom solutions for vanity cabinets', 'Under-sink options designed around your space', 'Dedicated places for daily essentials']
    }
  };

  const PROJECT_LABELS = {
    kitchen: 'Kitchen pull-outs', pantry: 'Pantry storage', closets: 'Custom closets',
    bathroom: 'Bathroom storage', multiple: 'Multiple spaces'
  };

  function initialize() {
    const query = (selector) => document.querySelector(selector);
    const all = (selector) => Array.from(document.querySelectorAll(selector));
    const menuToggle = query('#menu-toggle');
    const navigation = query('#primary-nav');
    const projectDialog = query('#project-dialog');
    const consultDialog = query('#consult-dialog');
    const consultForm = query('#consult-form');
    const formError = query('#form-error');
    const dialogTriggers = new WeakMap();
    const suppressFocusReturn = new WeakSet();
    let formStep = 1;

    function closeMenu() {
      menuToggle?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }

    menuToggle?.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(expanded));
      document.body.classList.toggle('nav-open', expanded);
    });
    navigation?.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
        closeMenu();
        menuToggle?.focus();
      }
    });
    const wideViewport = window.matchMedia('(min-width: 961px)');
    const viewportChange = (event) => { if (event.matches) closeMenu(); };
    if (wideViewport.addEventListener) wideViewport.addEventListener('change', viewportChange);
    else wideViewport.addListener?.(viewportChange);

    function updateHeader() {
      query('#site-header')?.classList.toggle('scrolled', window.scrollY > 40);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const galleryItems = all('[data-category]');
    const filters = all('[data-filter]');
    function filterGallery(value, announce) {
      let visibleCount = 0;
      galleryItems.forEach((item) => {
        const visible = value === 'all' || item.dataset.category === value;
        item.classList.toggle('is-hidden', !visible);
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      filters.forEach((button) => {
        const active = button.dataset.filter === value;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      const status = query('#gallery-status');
      if (status) {
        if (announce) status.setAttribute('aria-live', 'polite');
        status.textContent = `${visibleCount} ${visibleCount === 1 ? 'space' : 'spaces'} shown`;
      }
    }
    filters.forEach((button) => button.addEventListener('click', () => filterGallery(button.dataset.filter, true)));
    if (filters.length) {
      const initialFilter = filters.find((button) => button.classList.contains('active') || button.getAttribute('aria-pressed') === 'true');
      filterGallery(initialFilter?.dataset.filter || 'all', false);
    }

    function clearError() {
      if (formError) { formError.textContent = ''; formError.hidden = true; }
      consultForm?.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    }

    function showError(message, field) {
      if (formError) { formError.hidden = false; formError.textContent = message; }
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
      }
      return false;
    }

    function showStep(step) {
      formStep = step;
      consultForm?.querySelectorAll('[data-step]').forEach((fieldset) => {
        const visible = Number(fieldset.dataset.step) === step;
        fieldset.hidden = !visible;
        fieldset.disabled = !visible;
        fieldset.classList.toggle('active', visible);
        fieldset.setAttribute('aria-hidden', String(!visible));
        if (visible) fieldset.style.removeProperty('display');
        else fieldset.style.display = 'none';
      });
      const stepLabel = query('#consult-step-label') || query('#step-indicator');
      if (stepLabel) stepLabel.textContent = step === 3 ? 'Preview complete' : `Step ${step} of 2`;
      all('[data-progress-step]').forEach((indicator) => {
        const indicatorStep = Number(indicator.dataset.progressStep);
        indicator.classList.toggle('active', indicatorStep === step);
        indicator.classList.toggle('complete', indicatorStep < step);
        if (indicatorStep === step) indicator.setAttribute('aria-current', 'step');
        else indicator.removeAttribute('aria-current');
      });
      clearError();
    }

    function focusCurrentStep() {
      const currentStep = consultForm?.querySelector(`[data-step="${formStep}"]`);
      if (!currentStep) return;
      const firstControl = currentStep.querySelector('select, input, button, a[href], [tabindex="0"]');
      if (formStep === 3) {
        const summary = query('#confirmation-summary');
        if (summary) { summary.tabIndex = -1; summary.focus(); return; }
      }
      firstControl?.focus();
    }

    function resetConsultation() {
      consultForm?.reset();
      showStep(1);
      const summary = query('#confirmation-summary');
      if (summary) summary.textContent = '';
    }

    function showDialog(dialog, trigger) {
      if (!dialog || dialog.open) return;
      closeMenu();
      dialogTriggers.set(dialog, trigger || document.activeElement);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.setAttribute('open', ''); dialog.setAttribute('aria-modal', 'true'); }
      document.body.classList.add('dialog-open');
    }

    function closeDialog(dialog, restoreFocus = true) {
      if (!dialog?.open) return;
      if (!restoreFocus) suppressFocusReturn.add(dialog);
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); dialog.dispatchEvent(new Event('close')); }
    }

    all('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
      });
      dialog.addEventListener('close', () => {
        if (dialog === consultDialog) resetConsultation();
        if (!all('dialog').some((item) => item.open)) document.body.classList.remove('dialog-open');
        const trigger = dialogTriggers.get(dialog);
        dialogTriggers.delete(dialog);
        if (suppressFocusReturn.has(dialog)) suppressFocusReturn.delete(dialog);
        else if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      });
    });

    function openProject(key, trigger) {
      const project = PROJECTS[key];
      if (!project || !projectDialog) return;
      const textFields = {
        '#project-title': project.title,
        '#project-eyebrow': project.eyebrow,
        '#project-description': project.description
      };
      Object.entries(textFields).forEach(([selector, value]) => {
        const element = query(selector);
        if (element) element.textContent = value;
      });
      const image = query('#project-image');
      if (image) { image.src = project.image; image.alt = project.alt; }
      const features = query('#project-features');
      if (features) {
        features.replaceChildren(...project.features.map((feature) => {
          const item = document.createElement('li');
          item.textContent = feature;
          return item;
        }));
      }
      const consultButton = query('#project-consult');
      if (consultButton) consultButton.dataset.consult = key;
      showDialog(projectDialog, trigger);
    }

    function openConsultation(project, trigger) {
      if (!consultDialog) return;
      const returnTrigger = projectDialog?.open ? dialogTriggers.get(projectDialog) : trigger;
      closeDialog(projectDialog, false);
      resetConsultation();
      const projectType = query('#project-type');
      if (projectType && Object.hasOwn(PROJECT_LABELS, project)) projectType.value = project;
      showDialog(consultDialog, returnTrigger);
      focusCurrentStep();
    }

    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest('[data-close-dialog]');
      if (closeButton) { event.preventDefault(); closeDialog(closeButton.closest('dialog')); return; }
      const consultButton = event.target.closest('[data-consult]');
      if (consultButton) { event.preventDefault(); openConsultation(consultButton.dataset.consult, consultButton); return; }
      const projectButton = event.target.closest('[data-project]');
      if (projectButton) { event.preventDefault(); openProject(projectButton.dataset.project, projectButton); }
    });

    function validateProject() {
      clearError();
      const type = query('#project-type');
      const postal = query('#postal-code');
      if (!type || !Object.hasOwn(PROJECT_LABELS, type.value)) return showError('Choose the space you would like to explore.', type);
      const value = postal?.value.trim().toUpperCase() || '';
      const validUS = /^\d{5}(?:-\d{4})?$/.test(value);
      const validCanada = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ][ -]?\d[ABCEGHJ-NPRSTVWXYZ]\d$/.test(value);
      if (!validUS && !validCanada) return showError('Enter a valid US ZIP code or Canadian postal code.', postal);
      postal.value = value;
      return true;
    }

    function validateContact() {
      clearError();
      const name = query('#full-name');
      const email = query('#email');
      const phone = query('#phone');
      if (!name?.value.trim()) return showError('Please enter your name.', name);
      if (!email?.value.trim() || email.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return showError('Please enter a valid email address.', email);
      if (phone?.value.trim()) {
        const digits = phone.value.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) return showError('Enter a phone number with 7 to 15 digits, or leave it blank.', phone);
      }
      return true;
    }

    if (consultForm) {
      consultForm.noValidate = true;
      consultForm.querySelectorAll('[data-next], [data-back]').forEach((button) => { button.type = 'button'; });
      consultForm.addEventListener('input', (event) => {
        if (event.target.matches('input, select')) event.target.removeAttribute('aria-invalid');
      });
      consultForm.addEventListener('click', (event) => {
        const next = event.target.closest('[data-next]');
        const back = event.target.closest('[data-back]');
        if (next) {
          event.preventDefault();
          if (formStep === 1 && validateProject()) { showStep(2); focusCurrentStep(); }
        } else if (back) {
          event.preventDefault();
          showStep(1); focusCurrentStep();
        }
      });
      consultForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (formStep === 1) {
          if (validateProject()) { showStep(2); focusCurrentStep(); }
          return;
        }
        if (formStep !== 2 || !validateContact()) return;
        const summary = query('#confirmation-summary');
        const project = query('#project-type')?.value;
        const postal = query('#postal-code')?.value.trim();
        if (summary) summary.textContent = `You explored ${PROJECT_LABELS[project]?.toLowerCase() || 'custom storage'} for ${postal}. This is a design preview. Your information has not been sent and no appointment has been booked.`;
        showStep(3);
        focusCurrentStep();
      });
      resetConsultation();
    }

    const revealElements = all('[data-reveal]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) revealElements.forEach((element) => element.classList.add('revealed'));
    else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
        });
      }, { threshold: 0.08 });
      revealElements.forEach((element) => observer.observe(element));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
