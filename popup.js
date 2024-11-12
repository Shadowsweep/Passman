// Wait for the DOM to finish loading
window.onload = function() {
    // Get the necessary elements
    const setupScreen = document.getElementById('setupScreen');
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');
    const changeMasterScreen = document.getElementById('changeMasterScreen');
  
    const defaultPasswordInput = document.getElementById('defaultPassword');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const newMasterPassword = document.getElementById('newMasterPassword');
    const confirmMasterPassword = document.getElementById('confirmMasterPassword');
    const setupBtn = document.getElementById('setupBtn');
    const passwordHintInput = document.getElementById('passwordHint');
    const passwordHintText = document.getElementById('passwordHintText');
  
    const masterPasswordInput = document.getElementById('masterPassword');
    const unlockBtn = document.getElementById('unlockBtn');
    const lockBtn = document.getElementById('lockBtn');
    const changeMasterBtn = document.getElementById('changeMasterBtn');
  
    const addNewBtn = document.getElementById('addNewBtn');
    const addPasswordForm = document.getElementById('addPasswordForm');
    const websiteNameInput = document.getElementById('websiteName');
    const passwordInput = document.getElementById('passwordInput');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const passwordList = document.getElementById('passwordList');
    const generateNewBtn = document.getElementById('generateNewBtn');
    const copyGeneratedBtn = document.getElementById('copyGeneratedBtn');
    const generatedPassword = document.getElementById('generatedPassword');
    const passwordLength = document.getElementById('passwordLength');
    const lengthValue = document.getElementById('lengthValue');
  
    // Initialize the extension
    init();
  
    // Functions
    function init() {
      chrome.storage.local.get(['masterPasswordHash', 'passwordHint'], (data) => {
        if (!data.masterPasswordHash) {
          showSetupScreen();
        } else {
          showLoginScreen();
        }
      });
    }
  
    function showSetupScreen() {
      setupScreen.classList.add('active');
      loginScreen.classList.remove('active');
      mainScreen.classList.remove('active');
      changeMasterScreen.classList.remove('active');
      defaultPasswordInput.value = generatePassword();
  
      regenerateBtn.onclick = () => {
        defaultPasswordInput.value = generatePassword();
      };
  
      setupBtn.onclick = () => {
        const password = newMasterPassword.value || defaultPasswordInput.value;
        const confirmPassword = confirmMasterPassword.value || defaultPasswordInput.value;
        const hint = passwordHintInput.value.trim();
  
        if (!hint) {
          alert('Please provide a password hint!');
          return;
        }
  
        if (password === confirmPassword) {
          hashPassword(password).then((hash) => {
            chrome.storage.local.set({
              masterPasswordHash: hash,
              passwordHint: hint,
            }, () => {
              showLoginScreen();
            });
          });
        } else {
          alert('Passwords do not match!');
        }
      };
    }
  
    function showLoginScreen() {
      setupScreen.classList.remove('active');
      loginScreen.classList.add('active');
      mainScreen.classList.remove('active');
      changeMasterScreen.classList.remove('active');
      masterPasswordInput.value = '';
      passwordHintText.classList.add('hidden');
  
      unlockBtn.onclick = () => {
        chrome.storage.local.get(['masterPasswordHash', 'passwordHint'], (data) => {
          hashPassword(masterPasswordInput.value).then((inputHash) => {
            if (inputHash === data.masterPasswordHash) {
              showMainScreen();
            } else {
              passwordHintText.textContent = `Hint: ${data.passwordHint}`;
              passwordHintText.classList.remove('hidden');
              alert('Incorrect master password!');
            }
          });
        });
      };
  
      lockBtn.onclick = () => {
        showLoginScreen();
      };
  
      changeMasterBtn.onclick = () => {
        showChangeMasterScreen();
      };
    }
  
    function showMainScreen() {
      setupScreen.classList.remove('active');
      loginScreen.classList.remove('active');
      mainScreen.classList.add('active');
      changeMasterScreen.classList.remove('active');
      loadPasswords();
  
      addNewBtn.onclick = () => {
        addPasswordForm.classList.toggle('hidden');
      };
  
      savePasswordBtn.onclick = () => {
        const website = websiteNameInput.value.trim();
        const password = passwordInput.value.trim();
  
        if (website && password) {
          savePassword(website, password);
          websiteNameInput.value = '';
          passwordInput.value = '';
          addPasswordForm.classList.add('hidden');
        } else {
          alert('Please fill in all fields!');
        }
      };
  
      generateNewBtn.onclick = () => {
        generatedPassword.value = generatePassword(parseInt(passwordLength.value));
        lengthValue.textContent = passwordLength.value;
      };
  
      copyGeneratedBtn.onclick = () => {
        navigator.clipboard.writeText(generatedPassword.value);
        copyGeneratedBtn.textContent = '✓';
        setTimeout(() => {
          copyGeneratedBtn.textContent = '📋';
        }, 1500);
      };
    }
  
    function showChangeMasterScreen() {
      setupScreen.classList.remove('active');
      loginScreen.classList.remove('active');
      mainScreen.classList.remove('active');
      changeMasterScreen.classList.add('active');
  
      document.getElementById('updateMasterBtn').onclick = () => {
        const currentPassword = document.getElementById('currentMasterPassword').value;
        const newPassword = document.getElementById('newMasterPasswordChange').value;
        const confirmPassword = document.getElementById('confirmMasterPasswordChange').value;
  
        chrome.storage.local.get('masterPasswordHash', (data) => {
          hashPassword(currentPassword).then((currentHash) => {
            if (currentHash !== data.masterPasswordHash) {
              alert('Current password is incorrect!');
              return;
            }
  
            if (newPassword !== confirmPassword) {
              alert('New passwords do not match!');
              return;
            }
  
            hashPassword(newPassword).then((newHash) => {
              chrome.storage.local.set({ masterPasswordHash: newHash }, () => {
                showLoginScreen();
              });
            });
          });
        });
      };
  
      document.getElementById('cancelChangeBtn').onclick = () => {
        showMainScreen();
      };
    }
  
    function loadPasswords() {
      chrome.storage.local.get('passwords', (data) => {
        const { passwords = [] } = data;
        passwordList.innerHTML = '';
  
        passwords.forEach(({ website, password }) => {
          const passwordItem = createPasswordElement(website, password);
          passwordList.appendChild(passwordItem);
        });
      });
    }
  
    function createPasswordElement(website, password) {
      const div = document.createElement('div');
      div.className = 'password-item';
      div.innerHTML = `
        <h3>${website}</h3>
        <div class="password">
          <span>••••••••</span>
          <button class="copy-btn" data-password="${password}">Copy</button>
        </div>
      `;
  
      const copyBtn = div.querySelector('.copy-btn');
      copyBtn.onclick = (e) => {
        const password = e.target.getAttribute('data-password');
        navigator.clipboard.writeText(password);
        e.target.textContent = 'Copied!';
        setTimeout(() => {
          e.target.textContent = 'Copy';
        }, 1500);
      };
  
      return div;
    }
  
    function savePassword(website, password) {
      chrome.storage.local.get('passwords', (data) => {
        const { passwords = [] } = data;
        passwords.push({ website, password });
        chrome.storage.local.set({ passwords }, () => {
          loadPasswords();
        });
      });
    }
  
    function hashPassword(password) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      });
    }
  
    function generatePassword(length = 12) {
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    }
  };