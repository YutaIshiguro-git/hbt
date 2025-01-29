let isExistingRecord = false; // グローバル変数として定義

document.getElementById('adminForm').addEventListener('input', validateForm);

function validateForm() {
    let isValid = true;

    // Validate UNIT_NAME
    const unitName = document.getElementById('unitName').value;
    const unitNameError = document.getElementById('unitNameError');
    if (!unitName) {
        unitNameError.style.display = 'block';
        isValid = false;
    } else {
        unitNameError.style.display = 'none';
    }

    // Validate MOISTURE_LEVEL
    const moistureLevel = document.getElementById('moistureLevel').value;
    const moistureLevelError = document.getElementById('moistureLevelError');
    if (!moistureLevel || moistureLevel <= 0) {
        moistureLevelError.style.display = 'block';
        isValid = false;
    } else {
        moistureLevelError.style.display = 'none';
    }

    // Validate PIN_NUMBER
    const pinNumber = document.getElementById('pinNumber').value;
    const pinNumberError = document.getElementById('pinNumberError');
    if (!pinNumber || pinNumber <= 0) {
        pinNumberError.style.display = 'block';
        isValid = false;
    } else {
        pinNumberError.style.display = 'none';
    }

    // Validate ADC_CHANNEL
    const adcChannel = document.getElementById('adcChannel').value;
    const adcChannelError = document.getElementById('adcChannelError');
    if (!adcChannel || adcChannel < 0) {
        adcChannelError.style.display = 'block';
        isValid = false;
    } else {
        adcChannelError.style.display = 'none';
    }

    console.log('Form validation status:', isValid); // Debugging log
    document.getElementById('saveButton').disabled = !isValid;
}

async function populateData() {
    const unitName = document.getElementById('unitName').value;
    if (!unitName) {
        clearForm();
        isExistingRecord = false;
        return;
    }

    try {
        const response = await fetch('http://160.16.150.46:3000/api/plants');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const dataArray = await response.json();

        const matchingData = dataArray.find(item => item.UNIT_NAME === unitName);

        if (matchingData) {
            updateFormFields(matchingData);
            console.log('Loaded Data:', matchingData);
            isExistingRecord = true; // 記録が存在する場合は true
        } else {
            clearForm();
            isExistingRecord = false; // 記録が存在しない場合は false
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data. Please try again later.');
    }

    validateForm(); // Ensure form is validated after data is populated
}

function updateFormFields(data) {
    document.getElementById('moistureLevel').value = data.MOISTURE_LEVEL || '';
    document.getElementById('pinNumber').value = data.PIN_NUMBER || '';
    document.getElementById('adcChannel').value = data.ADC_CHANNEL || '';
    document.getElementById('plantName').value = data.PLANT_NAME || '';
    document.getElementById('plantDescription').value = data.PLANT_DESCRIPTION || '';
}

function clearForm() {
    document.getElementById('moistureLevel').value = '';
    document.getElementById('pinNumber').value = '';
    document.getElementById('adcChannel').value = '';
    document.getElementById('plantName').value = '';
    document.getElementById('plantDescription').value = '';
}

function saveData() {
    const data = {
        UNIT_NAME: document.getElementById('unitName').value,
        MOISTURE_LEVEL: parseInt(document.getElementById('moistureLevel').value, 10),
        PIN_NUMBER: parseInt(document.getElementById('pinNumber').value, 10),
        ADC_CHANNEL: parseInt(document.getElementById('adcChannel').value, 10),
        PLANT_NAME: document.getElementById('plantName').value,
        PLANT_DESCRIPTION: document.getElementById('plantDescription').value
    };

    if (!data.UNIT_NAME) {
        alert('Please select a UNIT_NAME.');
        return;
    }

    console.log('Saving data:', data);

    const method = isExistingRecord ? 'PUT' : 'POST'; // isExistingRecordを利用
    const url = isExistingRecord ? `http://160.16.150.46:3000/api/plants/${data.UNIT_NAME}` : 'http://160.16.150.46:3000/api/plants';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            alert('入力が完了しました');
            document.getElementById('adminForm').reset();
            isExistingRecord = false; // フォーム送信後にリセット
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to save data.');
        });
}

function navigateToListPage() {
    window.location.href = 'list.html';
}
