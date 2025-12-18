/**
 * DataService.js - Supabase Data Layer
 * Optimized for Supabase Free Tier
 * 
 * Features:
 * - Smart caching to reduce database queries
 * - File size optimization
 * - Image compression
 * - Offline support
 */

class DataService {
    constructor() {
        // Cache management
        this.cache = {
            subjects: { data: null, timestamp: null },
            documents: { data: null, timestamp: null }
        };
        
        // Admin state
        this.currentUser = null;
        this.session = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Get current session
            const { data: { session } } = await window.supabase.auth.getSession();
            this.session = session;
            this.currentUser = session?.user || null;

            // Listen for auth state changes
            window.supabase.auth.onAuthStateChange((_event, session) => {
                this.session = session;
                this.currentUser = session?.user || null;
            });
            
            this.initialized = true;
            console.log('✅ DataService initialized');
        } catch (error) {
            console.error('DataService init error:', error);
        }
    }

    // ==================== CACHE MANAGEMENT ====================
    
    isCacheValid(cacheKey) {
        if (!window.CACHE_CONFIG.USE_CACHE) return false;
        
        const cached = this.cache[cacheKey];
        if (!cached || !cached.timestamp || !cached.data) return false;
        
        const age = Date.now() - cached.timestamp;
        return age < window.CACHE_CONFIG.CACHE_DURATION;
    }

    setCache(cacheKey, data) {
        this.cache[cacheKey] = {
            data: data,
            timestamp: Date.now()
        };
    }

    clearCache(cacheKey = null) {
        if (cacheKey) {
            this.cache[cacheKey] = { data: null, timestamp: null };
        } else {
            // Clear all cache
            Object.keys(this.cache).forEach(key => {
                this.cache[key] = { data: null, timestamp: null };
            });
        }
    }

    // ==================== FILE OPTIMIZATION ====================
    
    async compressImage(base64Data, maxSize = window.CACHE_CONFIG.IMAGE_MAX_SIZE) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                const maxDim = 1200;
                if (width > height && width > maxDim) {
                    height = (height * maxDim) / width;
                    width = maxDim;
                } else if (height > maxDim) {
                    width = (width * maxDim) / height;
                    height = maxDim;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress
                let quality = 0.9;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Keep reducing quality until under size limit
                while (dataUrl.length > maxSize && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = base64Data;
        });
    }

    async validateFileSize(file, maxSize = window.CACHE_CONFIG.MAX_FILE_SIZE) {
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        }
        return true;
    }

    // ==================== AUTHENTICATION ====================

    async login(email, password) {
        try {
            // For backward compatibility with 'admin' username
            let loginEmail = email;
            if (email === 'admin') {
                loginEmail = 'admin@code-mitra.com';
            }
            
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: loginEmail,
                password: password
            });

            if (error) {
                return { 
                    success: false, 
                    message: error.message || 'Invalid credentials' 
                };
            }

            this.currentUser = data.user;
            this.session = data.session;
            
            return { 
                success: true, 
                message: 'Login successful',
                token: data.session.access_token 
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Login failed' 
            };
        }
    }

    async logout() {
        try {
            await window.supabase.auth.signOut();
            this.currentUser = null;
            this.session = null;
            this.clearCache();
        } catch (error) {
            }
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    async verifyAdmin() {
        return !!this.currentUser;
    }

    // ==================== SUBJECTS ====================

    async getAllSubjects() {
        // Check cache first
        if (this.isCacheValid('subjects')) {
            return this.cache.subjects.data;
        }

        try {
            const { data, error } = await window.supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Update cache
            this.setCache('subjects', data || []);
            
            return data || [];
        } catch (error) {
            throw error;
        }
    }

    async getSubjectById(subjectId) {
        try {
            const { data, error } = await window.supabase
                .from('subjects')
                .select('*')
                .eq('id', subjectId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    }

    async addSubject(subjectData) {
        try {
            // Compress image before storing
            let imageUrl = subjectData.image;
            
            if (subjectData.image && subjectData.image.startsWith('data:')) {
                imageUrl = await this.compressImage(subjectData.image, window.CACHE_CONFIG.IMAGE_MAX_SIZE);
            }

            const newSubject = {
                name: subjectData.name,
                description: subjectData.description || '',
                image: imageUrl
            };

            const { data, error } = await window.supabase
                .from('subjects')
                .insert([newSubject])
                .select()
                .single();

            if (error) throw error;
            
            // Clear cache to force refresh
            this.clearCache('subjects');
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    async updateSubject(subjectId, subjectData) {
        try {
            let imageUrl = subjectData.image;
            
            // Compress if new image
            if (subjectData.image && subjectData.image.startsWith('data:')) {
                imageUrl = await this.compressImage(subjectData.image, window.CACHE_CONFIG.IMAGE_MAX_SIZE);
            }

            const updateData = {
                name: subjectData.name,
                description: subjectData.description || '',
                image: imageUrl,
                updated_at: new Date().toISOString()
            };

            const { error } = await window.supabase
                .from('subjects')
                .update(updateData)
                .eq('id', subjectId);

            if (error) throw error;
            
            // Clear cache
            this.clearCache('subjects');
            
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async deleteSubject(subjectId) {
        try {
            // Delete all documents in this subject first
            const { error: docsError } = await window.supabase
                .from('documents')
                .delete()
                .eq('subject_id', subjectId);

            if (docsError) throw docsError;

            // Delete subject
            const { error } = await window.supabase
                .from('subjects')
                .delete()
                .eq('id', subjectId);

            if (error) throw error;
            
            // Clear cache
            this.clearCache();
            
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    // ==================== DOCUMENTS ====================

    async getAllDocuments() {
        try {
            const { data, error } = await window.supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw error;
        }
    }

    async getDocumentsBySubject(subjectId) {
        try {
            const { data, error } = await window.supabase
                .from('documents')
                .select('*')
                .eq('subject_id', subjectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw error;
        }
    }

    async getDocumentById(documentId) {
        try {
            const { data, error } = await window.supabase
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    }

    async uploadDocument(documentData) {
        try {
            const fileContent = documentData.content;
            const fileSize = this.estimateBase64Size(fileContent);

            // Validate file size
            await this.validateFileSize({ size: fileSize });

            let contentUrl = fileContent;
            let isStorageFile = false;

            // If file is large, upload to Storage; if small, keep in database as base64
            if (fileSize > window.CACHE_CONFIG.SMALL_FILE_THRESHOLD) {
                contentUrl = await this.uploadToStorage(fileContent, documentData.name, documentData.type);
                isStorageFile = true;
            }

            const newDocument = {
                subject_id: documentData.subjectId,
                name: documentData.name,
                description: documentData.description || '',
                type: documentData.type,
                content: contentUrl,
                is_storage_file: isStorageFile,
                file_size: fileSize
            };

            const { data, error } = await window.supabase
                .from('documents')
                .insert([newDocument])
                .select()
                .single();

            if (error) throw error;
            
            // Clear cache
            this.clearCache('documents');
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    async addDocument(documentData) {
        return this.uploadDocument(documentData);
    }

    async updateDocument(documentId, documentData) {
        try {
            const updateData = {
                name: documentData.name,
                description: documentData.description || '',
                type: documentData.type,
                updated_at: new Date().toISOString()
            };

            // Only update content if provided
            if (documentData.content) {
                const fileSize = this.estimateBase64Size(documentData.content);
                await this.validateFileSize({ size: fileSize });

                if (fileSize > window.CACHE_CONFIG.SMALL_FILE_THRESHOLD) {
                    updateData.content = await this.uploadToStorage(
                        documentData.content,
                        documentData.name,
                        documentData.type
                    );
                    updateData.is_storage_file = true;
                } else {
                    updateData.content = documentData.content;
                    updateData.is_storage_file = false;
                }
                updateData.file_size = fileSize;
            }

            const { error } = await window.supabase
                .from('documents')
                .update(updateData)
                .eq('id', documentId);

            if (error) throw error;
            
            // Clear cache
            this.clearCache('documents');
            
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async deleteDocument(documentId) {
        try {
            // Get document to check if file is in storage
            const doc = await this.getDocumentById(documentId);
            
            // If file is in storage, delete it
            if (doc && doc.is_storage_file && doc.content) {
                try {
                    const fileName = doc.content.split('/').pop().split('?')[0];
                    const { error: storageError } = await window.supabase.storage
                        .from('documents')
                        .remove([fileName]);
                    
                    if (storageError) {
                        } else {
                        }
                } catch (error) {
                    }
            }

            // Delete document from database
            const { error } = await window.supabase
                .from('documents')
                .delete()
                .eq('id', documentId);

            if (error) throw error;
            
            // Clear cache
            this.clearCache('documents');
            
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async searchDocuments(query, subjectId = null) {
        try {
            let queryBuilder = window.supabase
                .from('documents')
                .select('*');
            
            if (subjectId) {
                queryBuilder = queryBuilder.eq('subject_id', subjectId);
            }

            // Use ilike for case-insensitive search
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

            const { data, error } = await queryBuilder;

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw error;
        }
    }

    // ==================== SUPABASE STORAGE HELPERS ====================

    async uploadToStorage(base64Data, fileName, fileType) {
        try {
            // Convert base64 to blob
            const blob = this.base64ToBlob(base64Data);
            
            // Create unique file path
            const timestamp = Date.now();
            const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${timestamp}_${safeName}`;
            
            // Upload to storage
            const { data, error } = await window.supabase.storage
                .from('documents')
                .upload(filePath, blob, {
                    contentType: blob.type,
                    upsert: false
                });

            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = window.supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            
            return publicUrl;
        } catch (error) {
            throw error;
        }
    }

    base64ToBlob(base64Data) {
        const parts = base64Data.split(',');
        const contentType = parts[0].match(/:(.*?);/)[1];
        const byteString = atob(parts[1]);
        const byteArray = new Uint8Array(byteString.length);
        
        for (let i = 0; i < byteString.length; i++) {
            byteArray[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([byteArray], { type: contentType });
    }

    estimateBase64Size(base64String) {
        if (!base64String) return 0;
        
        // Remove data URL prefix if exists
        let base64 = base64String;
        if (base64.includes(',')) {
            base64 = base64.split(',')[1];
        }
        
        // Calculate size
        const padding = (base64.match(/=/g) || []).length;
        return (base64.length * 0.75) - padding;
    }

    // ==================== THEME ====================

    async getTheme() {
        const theme = localStorage.getItem('theme');
        return theme || 'dark';
    }

    async setTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // ==================== INITIALIZATION ====================

    async initializeDefaultData() {
        // No default data initialization - start with empty database
        console.log('📚 Database ready');
    }
}

// Create global instance
window.dataService = new DataService();

