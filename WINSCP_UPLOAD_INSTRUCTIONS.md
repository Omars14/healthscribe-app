# 📤 How to Upload Migration Scripts Using WinSCP

Since you already have WinSCP downloaded, here's exactly how to upload the migration scripts to your VPS.

## 🚀 **Step-by-Step WinSCP Instructions**

### **Step 1: Open WinSCP**
1. Launch WinSCP from your desktop or start menu
2. You'll see the login dialog

### **Step 2: Connect to Your VPS**
Fill in the connection details:
- **File protocol**: `SFTP`
- **Host name**: `154.26.155.207`
- **Port number**: `22`
- **User name**: `root`
- **Password**: `Nomar123`

### **Step 3: Connect**
1. Click **"Login"**
2. You might see a security warning - click **"Yes"** to continue
3. You should now see your VPS file system

### **Step 4: Navigate to Root Directory**
1. In the right panel (VPS), you should see the root directory (`/`)
2. If not, navigate to `/` by typing it in the address bar

### **Step 5: Upload the Migration Scripts**
You need to upload these 3 files to the `/root/` directory:

**Files to upload:**
- `clean-database-migration.sh`
- `migrate-data-clean.js`
- `run-clean-migration.sh`

**How to upload:**
1. In the **left panel** (your local computer), navigate to your project folder:
   `C:\Users\Omar\Desktop\AI website Latest\dashboard-next`

2. **Select all 3 files** in the left panel:
   - Hold `Ctrl` and click on each file
   - Or select the first file, hold `Shift`, and click the last file

3. **Drag and drop** the selected files to the right panel (VPS `/root/` directory)
   - Or right-click the selected files and choose **"Upload"**

4. **Wait for upload to complete** - you'll see a progress bar

### **Step 6: Verify Upload**
After upload, you should see these files in the `/root/` directory on your VPS:
- ✅ `clean-database-migration.sh`
- ✅ `migrate-data-clean.js`
- ✅ `run-clean-migration.sh`

## 🎯 **Alternative Upload Method (If Drag & Drop Doesn't Work)**

### **Method 1: Right-Click Upload**
1. Select the files in the left panel
2. Right-click on the selected files
3. Choose **"Upload"**
4. Select the destination as `/root/`

### **Method 2: Upload Dialog**
1. Go to **Commands** → **Upload**
2. Select the 3 files from your local directory
3. Set destination to `/root/`
4. Click **"OK"**

## 🔧 **After Upload - Run the Migration**

Once the files are uploaded, you can run the migration:

### **Option 1: Using WinSCP Terminal**
1. In WinSCP, go to **Commands** → **Open Terminal**
2. Run these commands:
```bash
cd /root
chmod +x run-clean-migration.sh
./run-clean-migration.sh
```

### **Option 2: Using SSH (Recommended)**
1. Open a separate SSH client (like PuTTY) or use Windows Terminal
2. Connect to your VPS:
```bash
ssh root@154.26.155.207
# Password: Nomar123
```
3. Run the migration:
```bash
cd /root
chmod +x run-clean-migration.sh
./run-clean-migration.sh
```

## 📋 **What the Migration Will Do**

The updated migration script will now:

✅ **Migrate All Database Records:**
- All 82 transcriptions
- All user profiles
- All reviews and edits
- All transcription metrics

⏭️ **Skip Audio Files:**
- Audio files will NOT be migrated
- Storage buckets will be created for new uploads
- Users can re-upload audio files as needed

✅ **Set Up Fresh Database:**
- Clean, conflict-free database
- All relationships preserved
- Proper indexes and security

## 🎉 **Expected Results**

After the migration:
- ✅ All your transcriptions will be visible
- ✅ Login will work perfectly
- ✅ All text data preserved
- ✅ Audio files can be re-uploaded as needed
- ✅ No database conflicts or issues

## 🚨 **Troubleshooting**

### **If WinSCP Connection Fails:**
- Make sure your VPS is running
- Check that port 22 is open
- Try using `SFTP` protocol instead of `SCP`

### **If Upload Fails:**
- Check your internet connection
- Make sure you have write permissions to `/root/`
- Try uploading files one by one

### **If Migration Fails:**
- Check the error messages in the terminal
- Make sure all 3 files were uploaded correctly
- Verify file permissions with `ls -la /root/`

## 📞 **Need Help?**

If you encounter any issues:
1. Check the WinSCP log for connection errors
2. Verify the files are in the correct location
3. Make sure the VPS is accessible
4. Try the SSH method instead of WinSCP terminal

---

## 🚀 **Quick Summary**

1. **Open WinSCP** → Connect to `154.26.155.207` with `root`/`Nomar123`
2. **Navigate to `/root/`** on the VPS
3. **Upload 3 files** from your local project folder
4. **SSH to VPS** and run `./run-clean-migration.sh`
5. **Wait for migration** to complete
6. **Test your application** - all transcriptions should be there!

Your medical transcription system will be running perfectly with all data migrated (except audio files)! 🎉




