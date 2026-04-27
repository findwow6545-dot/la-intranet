const PROJECT_ID = "la-intranet-8651f";
const TARGET_EMAIL = "jihwan@mokpo.ac.kr";

async function setAdmin() {
  // 1. 해당 이메일을 가진 문서 찾기
  const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/members`;
  const listRes = await fetch(listUrl);
  const data = await listRes.json();
  
  const targetDoc = data.documents.find(doc => doc.fields.email.stringValue === TARGET_EMAIL);
  
  if (!targetDoc) {
    console.error("Target member not found!");
    return;
  }

  const docName = targetDoc.name; // projects/.../databases/(default)/documents/members/ID
  console.log(`Found member: ${TARGET_EMAIL}, Doc ID: ${docName}`);

  // 2. role 필드 업데이트 (PATCH)
  // mask.fieldPaths=role 를 사용하여 role 필드만 업데이트
  const updateUrl = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=role`;
  
  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        ...targetDoc.fields,
        role: { stringValue: "admin" }
      }
    })
  });

  if (updateRes.ok) {
    console.log(`Successfully set ${TARGET_EMAIL} as ADMIN.`);
  } else {
    console.error("Failed to update role:", await updateRes.json());
  }
}

setAdmin().catch(console.error);
