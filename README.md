# 💰 Salary Calculator (โปรแกรมคำนวณเงินเดือน)

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-Server_Components-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)

เว็บแอปพลิเคชันสำหรับคำนวณและบันทึกเงินเดือนแบบรายวัน ถูกออกแบบมาสำหรับพนักงานที่รับค่าจ้างเป็นรายวัน มีการคิดค่าล่วงเวลา (OT), ค่ากะ (เช้า/ดึก), ค่าอาหาร และหักเงินสมทบประกันสังคม โดยนำเสนอผ่าน UI ที่ทันสมัย ใช้งานง่าย พร้อม Dashboard สรุปยอดเงินแบบเรียลไทม์

---

## ✨ ฟีเจอร์เด่น (Features)

- **🖥️ Modern Dashboard:** อินเทอร์เฟซสวยงาม ใช้งานง่าย โทนสี Dark Mode สบายตา พร้อมเอฟเฟกต์ Glassmorphism
- **⚙️ Dynamic Settings:** ตั้งค่าเรทค่าจ้างรายวัน, ค่าข้าว, ค่ากะ และเปอร์เซ็นต์ประกันสังคมได้เอง โดยระบบจะคำนวณใหม่ให้ทันที
- **📅 Flexible Date Range:** เลือกดูข้อมูลตามช่วงเวลาที่ต้องการ หรือจะดูข้อมูลของทั้งเดือนปัจจุบันก็ทำได้ง่ายๆ
- **🕒 OT & Shift Calculation:** คำนวณค่าล่วงเวลา (OT 1.5) และบวกค่ากะเช้า/ดึก ให้อัตโนมัติ
- **🧮 Real-time Summary:** สรุปยอดรวมรายได้พิเศษ (OT + กะ + ค่าข้าว), ยอดสุทธิหลังหักประกันสังคม และยอดรับสุทธิรวมทั้งหมดแบบเรียลไทม์
- **💾 Auto-save:** ทุกการเปลี่ยนแปลงในตารางจะถูกบันทึกลงฐานข้อมูลอัตโนมัติ (Debounced) หมดกังวลเรื่องลืมกดเซฟ

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend / Backend:** [Next.js (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (ตั้งค่าเริ่มต้นเป็น PostgreSQL ผ่าน Supabase แต่สามารถปรับเปลี่ยนได้)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Date Utility:** [date-fns](https://date-fns.org/)

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Installation & Setup)

### สิ่งที่ต้องมีเบื้องต้น (Prerequisites)
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)
- [Git](https://git-scm.com/)

### 1. โคลนโปรเจกต์ (Clone the repository)
```bash
git clone https://github.com/your-username/salarycal.git
cd salarycal
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Database
โปรเจกต์นี้ใช้ **PostgreSQL** (ตั้งค่าผ่าน Prisma)
1. คัดลอกไฟล์ `.env.example` เป็น `.env` (ถ้ามี) หรือสร้างไฟล์ `.env` ขึ้นมาใหม่
2. ใส่ Connection String ของ Database คุณลงไป เช่น:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/salarycal"
DIRECT_URL="postgresql://user:password@localhost:5432/salarycal"
```
*(ถ้าไม่มี PostgreSQL สามารถเปลี่ยน `provider = "postgresql"` เป็น `"sqlite"` ในไฟล์ `prisma/schema.prisma` แล้วลบ `directUrl` ออกได้สำหรับการรันบนเครื่องแบบรวดเร็ว)*

### 4. ซิงค์ Database Schema
รันคำสั่งนี้เพื่อสร้างตารางในฐานข้อมูล:
```bash
npx prisma db push
```

### 5. รัน Development Server
```bash
npm run dev
```
เข้าไปที่ [http://localhost:3000](http://localhost:3000) เพื่อเริ่มใช้งานแอปพลิเคชัน! 🎉

---

## 📖 วิธีการใช้งาน (Usage Guide)

1. **ตั้งค่าพื้นฐาน:** ส่วนบนสุดของจอจะมีแถบตั้งค่า กรอกค่าจ้างรายวัน, ค่าอาหาร, ค่ากะเช้า/ดึก เมื่อเสร็จแล้วกด **"Save Settings"**
2. **เลือกช่วงเวลา:** ใช้ Date Picker ด้านบนตารางเพื่อเลือกช่วงวันที่ต้องการคำนวณ หรือกด **"This Month"** เพื่อเลือกเดือนปัจจุบัน
3. **ลงเวลาทำงาน:**
   - กดปุ่ม **วงกลม** ในคอลัมน์ `Work?` เพื่อสลับว่าวันนั้นมาทำงานหรือไม่ (ถ้าเครื่องหมายติ๊กถูกสีเขียว 🟢 แสดงว่ามาทำงาน)
   - กดไอคอนรูปช้อนส้อม 🍽️ หากวันนั้นได้รับค่าข้าว
   - กรอกจำนวนชั่วโมงล่วงเวลาในช่อง **OT (Hrs)**
   - เลือกประเภทกะจาก Dropdown ในช่อง **Shift** (เช้า/ดึก)
4. **ดูผลรวม:** ด้านล่างสุดของตารางจะแสดง Grand Total (ยอดรวมรับสุทธิ) อัตโนมัติ

---

## 💡 คำแนะนำสำหรับการพัฒนาต่อยอด (Future Improvements)

หากต้องการนำไปพัฒนาต่อให้สมบูรณ์ขึ้น ขอแนะนำฟีเจอร์ดังนี้ครับ:

1. **ระบบ Authentication:** เพิ่มระบบ Login (เช่น Supabase Auth, NextAuth.js หรือ Clerk) เพื่อให้ผู้ใช้แต่ละคนมีบัญชีแยกกัน (ปัจจุบันใช้ Mock User ID).
2. **Export to PDF/Excel:** เพิ่มปุ่มดาวน์โหลดรายงานสลิปเงินเดือนเป็นไฟล์ PDF หรือ Excel เพื่อง่ายต่อการเก็บหลักฐาน.
3. **Custom Deduction:** เพิ่มฟิลด์สำหรับหักค่าใช้จ่ายอื่นๆ เช่น ขาดงาน, มาสาย, หรือหนี้สินยืมล่วงหน้า.
4. **Monthly SSO Cap:** ปกติการหักประกันสังคมในไทยจะมีฐานเงินเดือนสูงสุด (เช่น ไม่เกิน 15,000 บาท หักสูงสุด 750 บาท/เดือน) ควรเพิ่ม Logic เพื่อเช็คยอดรวมตลอดทั้งเดือนไม่ให้เกินเพดาน.
5. **PWA (Progressive Web App):** ทำให้สามารถติดตั้งเป็นแอปบนมือถือได้ เพื่อความสะดวกในการบันทึกเวลาเลิกงานผ่านสมาร์ทโฟน.

---

**Made with ❤️ using Next.js & Tailwind CSS**
