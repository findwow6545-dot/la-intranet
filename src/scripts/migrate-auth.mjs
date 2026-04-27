// Node.js native fetch used

const FIREBASE_API_KEY = "AIzaSyCTjh2GXaDC_bBL8LCLPyrAO5k84eACLiM";
const PROJECT_ID = "la-intranet-8651f";

async function getAllMembers() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/members`;
  const res = await fetch(url);
  const data = await res.json();
  return data.documents || [];
}

async function createAuthUser(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: false
    })
  });
  return await res.json();
}

async function migrate() {
  console.log("Starting migration...");
  const documents = await getAllMembers();
  
  for (const doc of documents) {
    const fields = doc.fields;
    const email = fields.email.stringValue;
    const phone = fields.phone.stringValue;
    
    // 전화번호에서 숫자만 추출
    const fullPhoneDigits = phone.replace(/[^0-9]/g, '');
    
    if (!email || fullPhoneDigits.length < 6) {
      console.log(`Skipping ${email || 'unknown'} - missing or invalid phone data`);
      continue;
    }

    console.log(`Creating account for ${email} with password (full phone digits)...`);
    const result = await createAuthUser(email, fullPhoneDigits);
    
    if (result.error) {
      if (result.error.message === 'EMAIL_EXISTS') {
        console.log(`- Account already exists for ${email}`);
      } else {
        console.error(`- Error creating account for ${email}:`, result.error.message);
      }
    } else {
      console.log(`- Success! Account created for ${email}`);
    }
  }
  
  console.log("Migration finished.");
}

migrate().catch(console.error);
