// Main JavaScript for task form handling
document.addEventListener('DOMContentLoaded', function() {
    // Initialize staff select with Choices.js
    const staffSelect = document.querySelector('select[name="staff"]');

    // Clear and initialize staff select
    staffSelect.innerHTML = '';
    
    // Fetch staff data
    fetch('/kepala/get-staff-for-assignment')
        .then(response => response.json())
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
                new Choices(staffSelect, {
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
            const errorOption = document.createElement('option');
            errorOption.textContent = `Tidak dapat memuat daftar staff: ${error.message}`;
            errorOption.disabled = true;
            staffSelect.appendChild(errorOption);
        });

    // Form validation and next step handling
    document.getElementById('nextButton').addEventListener('click', function() {
        let errorMessage = validateForm();
        
        if (errorMessage) {
            Swal.fire({
                icon: 'warning',
                title: 'Validasi Gagal!',
                text: errorMessage,
                confirmButtonText: 'OK',
                confirmButtonColor: '#C15E15',
            });
            return;
        }

        showRincianForm();
    });

    function validateForm() {
        const namaTugas = document.querySelector('input[name="nama_tugas"]').value.trim();
        const selectedStaff = Array.from(document.querySelector('select[name="staff"]').selectedOptions).map(opt => opt.value);
        const deskripsi = document.querySelector('textarea[name="deskripsi"]').value.trim();
        const tanggalPengumpulan = document.querySelector('input[name="tanggal_pengumpulan"]').value;
        const jamPengumpulan = document.querySelector('input[name="jam_pengumpulan"]').value;
        
        if (!namaTugas) return "Nama Tugas harus diisi";
        if (selectedStaff.length === 0) return "Pilih minimal satu staff";
        if (!deskripsi) return "Deskripsi tugas harus diisi";
        if (!tanggalPengumpulan) return "Tanggal Pengumpulan harus diisi";
        if (!jamPengumpulan) return "Jam Pengumpulan harus diisi";

        // Validate deadline is not in the past
        const deadline = new Date(`${tanggalPengumpulan}T${jamPengumpulan}`);
        if (deadline < new Date()) {
            return "Deadline tidak boleh di masa lalu";
        }

        // Validate rincian tugas for each staff
        const staffContainers = document.querySelectorAll('[id^="rincianContainer-"]');
        for (const container of staffContainers) {
            const staffId = container.id.split('-')[1];
            const rincianInputs = container.querySelectorAll('input[type="text"]');
            const hasEmptyRincian = Array.from(rincianInputs).some(input => !input.value.trim());
            
            if (hasEmptyRincian) {
                return "Semua rincian tugas harus diisi";
            }
        }

        return "";
    }

    function showRincianForm() {
        const selectedStaff = Array.from(staffSelect.selectedOptions).map(opt => ({
            id: opt.value,
            name: opt.textContent
        }));

        const staffRincianContainer = document.getElementById('staffRincianContainer');
        staffRincianContainer.innerHTML = '';

        selectedStaff.forEach(staff => {
            const staffContainer = createStaffRincianSection(staff);
            staffRincianContainer.appendChild(staffContainer);
        });

        document.getElementById('secondContainer').classList.remove('hidden');
        document.getElementById('rincianContainer').classList.remove('hidden');
        document.getElementById('secondContainer').scrollIntoView({ behavior: 'smooth' });
    }

    function createStaffRincianSection(staff) {
        const container = document.createElement('div');
        container.classList.add('space-y-6', 'bg-gray-100', 'p-6', 'rounded-lg', 'mb-4');

        const title = document.createElement('h3');
        title.classList.add('text-l', 'font-bold', 'mb-4');
        title.textContent = `Rincian Tugas ${staff.name}`;

        const rincianContainer = document.createElement('div');
        rincianContainer.classList.add('space-y-4');
        rincianContainer.id = `rincianContainer-${staff.id}`;

        // Add initial input
        const initialInput = createRincianInput(staff.id);
        rincianContainer.appendChild(initialInput);

        // Add button
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.innerHTML = '<ion-icon name="add-outline" class="mr-2"></ion-icon> Tambah';
        addButton.classList.add('px-4', 'py-2', 'bg-green-600', 'text-white', 'rounded-md', 'hover:bg-green-700', 'flex', 'items-center', 'mt-2');
        
        addButton.addEventListener('click', () => {
            const newInput = createRincianInput(staff.id, true);
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
        input.classList.add('w-full', 'p-3', 'border', 'border-gray-300', 'rounded-md');

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

    // Form submission handling
    // Add this to your existing taskForm.js, replacing the existing submit handler
    document.getElementById('taskForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all inputs first
        let errorMessage = validateForm();
        if (errorMessage) {
            Swal.fire({
                icon: 'warning',
                title: 'Validasi Gagal!',
                text: errorMessage,
                confirmButtonText: 'OK',
                confirmButtonColor: '#C15E15',
            });
            return;
        }
    
        // Collect form data
        const formData = new FormData(this);
        
        // Get all staff tasks
        const staffTasks = [];
        const staffContainers = document.querySelectorAll('[id^="rincianContainer-"]');
        
        staffContainers.forEach(container => {
            const staffId = container.id.split('-')[1];
            const rincianInputs = container.querySelectorAll('input[type="text"]');
            const rincian = Array.from(rincianInputs)
                .map(input => input.value.trim())
                .filter(value => value !== ''); // Remove empty values
            
            if (rincian.length > 0) {
                staffTasks.push({
                    staffId: staffId,
                    rincian: rincian
                });
            }
        });
    
        // Add staff tasks to form data
        formData.append('staff_tasks', JSON.stringify(staffTasks));
    
        try {
            const response = await fetch('/kepala/add-task', {
                method: 'POST',
                body: formData
            });
    
            const result = await response.json();
    
            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Tugas berhasil ditambahkan',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#C15E15',
                });
                window.location.href = '/kepala/tugas';
            } else {
                throw new Error(result.message || 'Gagal menambahkan tugas');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: error.message || 'Terjadi kesalahan saat menambahkan tugas',
                confirmButtonText: 'OK',
                confirmButtonColor: '#C15E15',
            });
        }
    });
});
