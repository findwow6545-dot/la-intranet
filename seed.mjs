const students = [
  { studentId: '234306', name: '서원', batch: '2기', grade: '4학년 (휴학)', phone: '010-7128-2134', email: 'td00_01@naver.com', address: '전라남도 함평군 함평읍 영수길 28, 102동 1504호', researchFields: '', photoUrl: '' },
  { studentId: '234311', name: '이시현', batch: '2기', grade: '4학년', phone: '010-9222-0690', email: 'tus0920@naver.com', address: '전라남도 목포시 당가두로13번길 35 201동 1104호', researchFields: '', photoUrl: '' },
  { studentId: '234301', name: '김수인', batch: '2기', grade: '3학년', phone: '010-4243-3719', email: 's00in2@naver.com', address: '전라남도 영암군 동문로 62-7', researchFields: '', photoUrl: '' },
];

async function seed() {
  for (const s of students) {
    const res = await fetch('https://firestore.googleapis.com/v1/projects/la-intranet-8651f/databases/(default)/documents/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          studentId: { stringValue: s.studentId },
          name: { stringValue: s.name },
          batch: { stringValue: s.batch },
          grade: { stringValue: s.grade },
          phone: { stringValue: s.phone },
          email: { stringValue: s.email },
          address: { stringValue: s.address },
          researchFields: { stringValue: "" },
          photoUrl: { stringValue: 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(s.name) },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      })
    });
    console.log(await res.json());
  }
}
seed();
