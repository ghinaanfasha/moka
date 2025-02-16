document.addEventListener('DOMContentLoaded', function() {
    // Initialize staff select with Choices.js
    const staffSelect = document.querySelector('select[name="staff"]');
    const taskForm = document.getElementById('taskForm');
    let choicesInstance;

    // Clear and initialize staff select
    staffSelect.innerHTML = '';
    
    // Fetch staff data
    fetch('/staff/get-staff-for-assignment', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Sesi telah berakhir. Silakan login kembali.');
            }
            throw new Error('Gagal mengambil data staff');
        }
        return response.json();
    })
    .then(staff => {
        if (staff.length === 0) {
            const noStaffOption = document.createElement('option');
            noStaffOption.textContent = 'Tidak ada staff tersedia';
            noStaffOption.disabled = true;
            staffSelect.appendChild(noStaffOption);
        } else {
            staff.forEach(user => {
                const option = document.createElement('option');
                option.value = user.userID;
                option.textContent = `${user.username} (${user.roleName || 'Tanpa Role'} - ${user.deptName || 'Tanpa Departemen'})`;
                staffSelect.appendChild(option);
            });

            // Initialize Choices.js
            choicesInstance = new Choices(staffSelect, {
                removeItemButton: true,
                searchEnabled: true,
                placeholderValue: 'Pilih Staff',
                noChoicesText: 'Tidak ada pilihan tersedia',
                itemSelectText: 'Tekan untuk memilih',
                maxItemCount: 10,
                searchResultLimit: 10,
                searchPlaceholderValue: 'Cari staff...'
            });
        }
    })
    .catch(error => {
        console.error('Error fetching staff:', error);
        if (error.message.includes('login')) {
            window.location.href = '/';
            return;
        }
        const errorOption = document.createElement('option');
        errorOption.textContent = `Tidak dapat memuat daftar staff: ${error.message}`;
        errorOption.disabled = true;
        staffSelect.appendChild(errorOption);
    });

    // Form submission
    taskForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        document.getElementById('loadingOverlay').classList.remove('hidden');
        
        try {
            console.log("Form submission started");
            
            let errorMessage = validateForm();
            if (errorMessage) {
                throw new Error(errorMessage);
            }

            // Create FormData
            const formData = new FormData(this);
            
            // Get selected staff and their tasks
            const selectedStaff = choicesInstance.getValue();
            if (!selectedStaff || selectedStaff.length === 0) {
                throw new Error('Pilih minimal satu staff');
            }

            // Collect staff tasks
            const staffTasks = [];
            let hasRincian = false;

            selectedStaff.forEach(staff => {
                const container = document.getElementById(`rincianContainer-${staff.value}`);
                if (!container) {
                    throw new Error(`Container untuk staff ${staff.label} tidak ditemukan`);
                }

                const rincianInputs = container.querySelectorAll('input[type="text"]');
                const rincian = Array.from(rincianInputs)
                    .map(input => input.value.trim())
                    .filter(value => value !== '');

                if (rincian.length > 0) {
                    hasRincian = true;
                    staffTasks.push({
                        staffId: staff.value,
                        rincian: rincian
                    });
                }
            });

            if (!hasRincian) {
                throw new Error('Minimal satu rincian tugas harus diisi untuk setiap staff');
            }

            // Add staff tasks to form data
            formData.append('staff_tasks', JSON.stringify(staffTasks));

            // Log form data for debugging
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            const response = await fetch('/staff/add-task', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const result = await response.json();
                if (response.status === 401) {
                    throw new Error('Sesi telah berakhir. Silakan login kembali.');
                }
                throw new Error(result.message || 'Gagal menambahkan tugas');
            }

            const result = await response.json();
            console.log("Server response:", result);

            await Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Tugas berhasil ditambahkan',
                confirmButtonText: 'OK',
                confirmButtonColor: '#C15E15',
            });

            window.location.href = '/staff/tugas';

        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('login')) {
                window.location.href = '/login';
                return;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: error.message || 'Terjadi kesalahan saat menambahkan tugas',
                confirmButtonText: 'OK',
                confirmButtonColor: '#C15E15',
            });
        } finally {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }
    });


    // Validation function
    function validateForm() {
        const namaTugas = document.querySelector('input[name="nama_tugas"]').value.trim();
        const selectedStaff = choicesInstance.getValue();
        const deskripsi = document.querySelector('textarea[name="deskripsi"]').value.trim();
        const tanggalPengumpulan = document.querySelector('input[name="tanggal_pengumpulan"]').value;
        const jamPengumpulan = document.querySelector('input[name="jam_pengumpulan"]').value;
        
        if (!namaTugas) return "Nama Tugas harus diisi";
        if (selectedStaff.length === 0) return "Pilih minimal satu staff";
        if (!deskripsi) return "Deskripsi tugas harus diisi";
        if (!tanggalPengumpulan) return "Tanggal Pengumpulan harus diisi";
        if (!jamPengumpulan) return "Jam Pengumpulan harus diisi";

        const deadline = new Date(`${tanggalPengumpulan}T${jamPengumpulan}`);
        if (deadline < new Date()) {
            return "Deadline tidak boleh di masa lalu";
        }

        // Only validate rincian if we're on the second form
        if (!document.getElementById('secondContainer').classList.contains('hidden')) {
            const staffContainers = document.querySelectorAll('[id^="rincianContainer-"]');
            for (const container of staffContainers) {
                const rincianInputs = container.querySelectorAll('input[type="text"]');
                const hasEmptyRincian = Array.from(rincianInputs).some(input => !input.value.trim());
                
                if (hasEmptyRincian) {
                    return "Semua rincian tugas harus diisi";
                }
            }
        }

        return "";
    }

    // Handle next button click
    document.getElementById('nextButton').addEventListener('click', function() {
        // Only validate the first form fields
        const firstFormValidation = validateFirstForm();
        
        if (firstFormValidation) {
            Swal.fire({
                icon: 'warning',
                title: 'Validasi Gagal!',
                text: firstFormValidation,
                confirmButtonText: 'OK',
                confirmButtonColor: '#C15E15',
            });
            return;
        }

        showRincianForm();
    });

    // Validation for first form only
    function validateFirstForm() {
        const namaTugas = document.querySelector('input[name="nama_tugas"]').value.trim();
        const selectedStaff = choicesInstance.getValue();
        const deskripsi = document.querySelector('textarea[name="deskripsi"]').value.trim();
        const tanggalPengumpulan = document.querySelector('input[name="tanggal_pengumpulan"]').value;
        const jamPengumpulan = document.querySelector('input[name="jam_pengumpulan"]').value;
        
        if (!namaTugas) return "Nama Tugas harus diisi";
        if (selectedStaff.length === 0) return "Pilih minimal satu staff";
        if (!deskripsi) return "Deskripsi tugas harus diisi";
        if (!tanggalPengumpulan) return "Tanggal Pengumpulan harus diisi";
        if (!jamPengumpulan) return "Jam Pengumpulan harus diisi";

        const deadline = new Date(`${tanggalPengumpulan}T${jamPengumpulan}`);
        if (deadline < new Date()) {
            return "Deadline tidak boleh di masa lalu";
        }

        return "";
    }

    // Back button handler
    document.getElementById('backButton').addEventListener('click', function() {
        document.getElementById('secondContainer').classList.add('hidden');
        document.getElementById('firstContainer').classList.remove('hidden');
        document.getElementById('firstContainer').scrollIntoView({ behavior: 'smooth' });
    });

    function showRincianForm() {
        const selectedStaff = choicesInstance.getValue();
        const staffRincianContainer = document.getElementById('staffRincianContainer');
        staffRincianContainer.innerHTML = '';

        selectedStaff.forEach(staff => {
            const staffContainer = createStaffRincianSection(staff);
            staffRincianContainer.appendChild(staffContainer);
        });

        // Instead of hiding, just show the second container
        document.getElementById('secondContainer').classList.remove('hidden');
        document.getElementById('secondContainer').scrollIntoView({ behavior: 'smooth' });
    }

    function createStaffRincianSection(staff) {
        const container = document.createElement('div');
        container.classList.add('space-y-6', 'bg-gray-100', 'p-6', 'rounded-lg', 'mb-4');

        const title = document.createElement('h3');
        title.classList.add('text-l', 'font-bold', 'mb-4');
        title.textContent = `Rincian Tugas untuk ${staff.label}`;

        const rincianContainer = document.createElement('div');
        rincianContainer.classList.add('space-y-4');
        rincianContainer.id = `rincianContainer-${staff.value}`;

        const initialInput = createRincianInput(staff.value);
        rincianContainer.appendChild(initialInput);

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.innerHTML = '<ion-icon name="add-outline" class="mr-2"></ion-icon> Tambah Rincian';
        addButton.classList.add('px-4', 'py-2', 'bg-green-600', 'text-white', 'rounded-md', 'hover:bg-green-700', 'flex', 'items-center', 'mt-2');
        
        addButton.addEventListener('click', () => {
            const newInput = createRincianInput(staff.value, true);
            rincianContainer.appendChild(newInput);
        });

        container.appendChild(title);
        container.appendChild(rincianContainer);
        container.appendChild(addButton);

        return container;
    }

    function createRincianInput(staffId, removable = false) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('flex', 'items-center', 'space-x-2', 'mt-2');

        const input = document.createElement('input');
        input.type = 'text';
        input.name = `rincian_tugas_${staffId}[]`;
        input.required = true;
        input.placeholder = 'Masukkan rincian tugas...';
        input.classList.add('w-full', 'p-3', 'border', 'border-gray-300', 'rounded-md', 'focus:ring-2', 'focus:ring-[#C15E15]', 'focus:border-transparent');

        wrapper.appendChild(input);

        if (removable) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
            removeButton.classList.add('p-2', 'bg-red-500', 'text-white', 'rounded-md', 'hover:bg-red-700');
            
            removeButton.addEventListener('click', () => wrapper.remove());
            wrapper.appendChild(removeButton);
        }

        return wrapper;
    }
});