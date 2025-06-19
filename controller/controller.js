let selectedFile = null;
let selectedModel = 'resnet50';

// Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const fileInfo = document.getElementById('fileInfo');
const fileDetails = document.getElementById('fileDetails');
const predictBtn = document.getElementById('predictBtn');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const resultText = document.getElementById('resultText');
const modelBtns = document.querySelectorAll('.model-btn');

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Model selection
modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedModel = btn.dataset.model;
    });
});

// Predict button
predictBtn.addEventListener('click', predict);

function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Harap pilih file gambar yang valid!');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 10MB.');
        return;
    }

    selectedFile = file;

    console.log('Selected file:', file);

    // Show file info
    fileDetails.innerHTML = `
        <strong>Nama:</strong> ${file.name}<br>
        <strong>Ukuran:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB<br>
        <strong>Tipe:</strong> ${file.type}
    `;
    fileInfo.style.display = 'block';

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Enable predict button
    predictBtn.disabled = false;

    // Hide previous results
    resultArea.style.display = 'none';
}

function predict() {
    if (!selectedFile) {
        alert('Harap pilih gambar terlebih dahulu!');
        return;
    }

    // Show loading
    loading.style.display = 'block';
    predictBtn.disabled = true;
    resultArea.style.display = 'none';

    // Convert model name to match backend expectations
    const modelForBackend = selectedModel === 'resnet50' ? 'resnet' : 'efficientnet';

    // Siapkan data untuk dikirim
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('model', modelForBackend);
    
    // Log untuk debugging - cara yang benar
    console.log('Selected file:', selectedFile);
    console.log('Selected model:', selectedModel);
    console.log('Model for backend:', modelForBackend);
    console.log('FormData image:', formData.get('image'));
    console.log('FormData model:', formData.get('model'));

    // Kirim ke backend
    fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Hide loading
        loading.style.display = 'none';
        predictBtn.disabled = false;

        // Tampilkan hasil dari backend
        const results = data.predictions; // pastikan backend kirim: { predictions: [{ class, confidence }, ...] }
        
        if (!results || !Array.isArray(results)) {
            throw new Error('Invalid response format from server');
        }
        
        let resultHTML = `
            <h4>🎯 Hasil Prediksi (${selectedModel.toUpperCase()}):</h4>
            <div style="margin-top: 15px;">
        `;

        results.forEach((result, index) => {
            const percentage = (result.confidence * 100).toFixed(1);
            resultHTML += `
                <div style="margin-bottom: 10px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">${index + 1}. ${result.class}</span>
                        <span style="color: #667eea; font-weight: 600;">${percentage}%</span>
                    </div>
                    <div style="background: #eee; height: 8px; border-radius: 4px; margin-top: 5px;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); height: 100%; width: ${percentage}%; border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        });

        resultHTML += `</div>`;
        resultText.innerHTML = resultHTML;
        resultArea.style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        loading.style.display = 'none';
        predictBtn.disabled = false;
        alert('Terjadi kesalahan saat mengirim data ke server: ' + error.message);
    });
}