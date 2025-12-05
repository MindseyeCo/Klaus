
// ... existing imports ...
import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser, signOut as firebaseSignOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, Firestore, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, setDoc, getDoc, getDocs, deleteDoc, limit, arrayUnion, arrayRemove, startAfter } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';
import { User, Message, ChatRoom, Community, Channel, NexusPost } from '../types';
import { GoogleGenAI } from "@google/genai";
import { syncProfileToSupabase } from './supabase';
import { saveLocalKeepsake, removeLocalKeepsake } from './keepsakes';

// Initialize Gemini with the specific key provided for AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// KLAUS PROJECT CONFIGURATION
let firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDO3PVRdfI8-n47EwsP4c2wX0Imw7piD4A",
  authDomain: "klaus-jgu3y.firebaseapp.com",
  databaseURL: "https://klaus-jgu3y-default-rtdb.firebaseio.com",
  projectId: "klaus-jgu3y",
  storageBucket: "klaus-jgu3y.firebasestorage.app",
  messagingSenderId: "1029233931992",
  appId: "1:1029233931992:web:ff63969da5ad67c41bc9ad"
};

// ... existing initFirebase ...
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let rtdb: Database | undefined;

export let firebaseInitializationError: string | null = null;

const initFirebase = (config: FirebaseOptions) => {
  try {
    if (!config.apiKey) throw new Error("Missing API Key");
    
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    rtdb = getDatabase(app);
    
    firebaseInitializationError = null;
    console.log("Firebase initialized successfully");
  } catch (error: any) {
    console.error("Firebase Initialization Error:", error);
    firebaseInitializationError = error.message || "Unknown initialization error";
  }
};

initFirebase(firebaseConfig);

export const updateFirebaseConfig = (apiKey: string) => {
  firebaseConfig = { ...firebaseConfig, apiKey };
  initFirebase(firebaseConfig);
  return !firebaseInitializationError;
};

// ... existing constants ...
const KLAUS_ID = 'klaus-ai';
const KLAUS_USER: User = {
  uid: KLAUS_ID,
  email: 'system@klaus.ai',
  displayName: 'Klaus AI',
  handle: '@klaus_ai',
  photoURL: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=klaus&backgroundColor=b30000',
  status: 'System Operational. Precision Guaranteed.',
  statusState: 'online',
  isOnline: true,
  about: "I am Klaus, a chat AI with a persona inspired by German precision engineering and industrial design. I am efficient, direct, slightly formal but helpful. I value clarity and structure.",
  themeSongUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
};

// ... existing handle helpers ...
const generateUniqueHandle = async (displayName: string | null): Promise<string> => {
    const base = (displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    let candidate = `@${base}`;
    if (candidate.length < 4) candidate = candidate + 'user';

    if (await checkHandleAvailability(candidate)) return candidate;

    let attempts = 0;
    while (attempts < 5) {
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const nextCandidate = `@${base}${randomSuffix}`;
        if (await checkHandleAvailability(nextCandidate)) return nextCandidate;
        attempts++;
    }
    return `@${base}${Date.now().toString().slice(-6)}`;
};

export const ensureUserHandle = async (uid: string, displayName: string | null) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            if (!data.handle) {
                const newHandle = await generateUniqueHandle(displayName || data.displayName);
                await setDoc(userRef, { handle: newHandle }, { merge: true });
                syncProfileToSupabase({ uid, handle: newHandle });
                return newHandle;
            }
            return data.handle;
        }
    } catch (e) {
        console.error("Error ensuring handle:", e);
    }
    return null;
};

// ... existing auth services (loginWithEmail, loginWithGoogle, registerWithEmail, etc) ...

export const loginWithEmail = async (email: string, password: string): Promise<void> => {
  if (!auth || !db) throw new Error("Firebase not initialized");
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userRef = doc(db, 'users', user.uid);
  
  await setDoc(userRef, { 
    uid: user.uid,
    email: user.email,
    isOnline: true, 
    statusState: 'online', 
    lastSeen: serverTimestamp() 
  }, { merge: true });

  await ensureUserHandle(user.uid, user.displayName);
};

export const loginWithGoogle = async (): Promise<void> => {
  if (!auth || !db) throw new Error("Firebase not initialized");
  const provider = new GoogleAuthProvider();
  try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      const userData: any = {
        uid: user.uid,
        email: user.email,
        isOnline: true,
        statusState: 'online',
        lastSeen: serverTimestamp()
      };
      if (!docSnap.exists()) {
          const autoHandle = await generateUniqueHandle(user.displayName);
          await setDoc(userRef, {
              ...userData,
              displayName: user.displayName || 'Unknown Personnel',
              searchName: (user.displayName || 'unknown').toLowerCase().trim(),
              handle: autoHandle, 
              photoURL: user.photoURL,
              status: 'Available',
              createdAt: serverTimestamp(),
              friendRequests: { incoming: [], outgoing: [] },
              friends: []
          }, { merge: true });
          syncProfileToSupabase({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, handle: autoHandle });
      } else {
          await setDoc(userRef, userData, { merge: true });
          await ensureUserHandle(user.uid, user.displayName);
      }
  } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
          throw new Error("This domain is not authorized. Please add it in Firebase Console.");
      }
      throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, displayName: string): Promise<void> => {
  if (!auth || !db) throw new Error("Firebase not initialized");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=B30000&color=fff`;

  await updateProfile(user, { displayName: displayName, photoURL: photoURL });
  const autoHandle = await generateUniqueHandle(displayName);

  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    searchName: displayName.toLowerCase().trim(), 
    handle: autoHandle, 
    photoURL: photoURL,
    isOnline: true,
    status: 'Available',
    statusState: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
    friendRequests: { incoming: [], outgoing: [] },
    friends: []
  }, { merge: true });
  
  syncProfileToSupabase({ uid: user.uid, email: user.email, displayName: displayName, photoURL: photoURL, handle: autoHandle });
};

export const logout = async () => {
  if (!auth || !db) return;
  if (auth.currentUser) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { isOnline: false, statusState: 'offline', lastSeen: serverTimestamp() }).catch(e => console.warn(e));
    await firebaseSignOut(auth);
  }
};

export const deleteUserAccount = async () => {
  if (!auth || !db || !auth.currentUser) return;
  const uid = auth.currentUser.uid;
  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(auth.currentUser);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, (user) => { callback(user ? mapFirebaseUser(user) : null); });
};

// ... getUserProfile, cleanData ...

export const getUserProfile = async (uid: string): Promise<User | null> => {
  if (uid === KLAUS_ID) return KLAUS_USER;
  if (!db) return null;
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) { return { ...docSnap.data(), uid: uid } as User; }
  return null;
};

const cleanData = (data: any) => {
    const cleaned: any = {};
    Object.keys(data).forEach(key => { if (data[key] !== undefined) cleaned[key] = data[key]; });
    return cleaned;
};

// ... handle system ...

export const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    if (!db) return false;
    const cleanHandle = handle.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('handle', '==', cleanHandle));
    try {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            if (auth?.currentUser && snapshot.docs[0].id === auth.currentUser.uid) return true;
            return false;
        }
        return true;
    } catch (e) { return true; }
};

export const setUserHandle = async (handle: string) => {
    if (!db || !auth) throw new Error("No connection");
    const uid = auth.currentUser!.uid;
    const email = auth.currentUser!.email;
    const cleanHandle = handle.toLowerCase().trim();
    
    if (!/^@[a-z0-9_]{3,15}$/.test(cleanHandle)) throw new Error("Handle invalid.");

    const isAvailable = await checkHandleAvailability(cleanHandle);
    if (!isAvailable) throw new Error(`Handle ${cleanHandle} is taken.`);

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const existingData = userSnap.exists() ? userSnap.data() : {};

    await setDoc(userRef, { ...existingData, uid: uid, email: email, handle: cleanHandle, updatedAt: serverTimestamp() }, { merge: true });
    syncProfileToSupabase({ uid, email: email || '', handle: cleanHandle });
};

// ... keepsakes (addKeepsake, removeKeepsake, subscribeToKeepsakes) ...

export const addKeepsake = async (item: NexusPost) => {
    if(!db || !auth) return;
    const uid = auth.currentUser!.uid;
    const keepsakeRef = doc(db, 'users', uid, 'keepsakes', item.id);
    await setDoc(keepsakeRef, { ...item, savedAt: serverTimestamp() });
    await saveLocalKeepsake(item);
};

export const removeKeepsake = async (itemId: string) => {
    if(!db || !auth) return;
    const uid = auth.currentUser!.uid;
    await deleteDoc(doc(db, 'users', uid, 'keepsakes', itemId));
    await removeLocalKeepsake(itemId);
};

export const subscribeToKeepsakes = (callback: (items: NexusPost[]) => void) => {
    if(!db || !auth || !auth.currentUser) return () => {};
    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'keepsakes'), orderBy('savedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as NexusPost);
        callback(items);
    });
};

// ... user browsing/search ...

export const browseUsers = async (): Promise<User[]> => {
    if (!db || !auth) return [KLAUS_USER];
    const usersRef = collection(db, 'users');
    try {
        // Fetch up to 2000 users to ensure comprehensive directory visibility
        const q = query(usersRef, limit(2000)); 
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(d => ({ ...d.data(), uid: d.id } as User));
        
        // Remove self from list but keep everyone else
        const validUsers = users.filter(u => u.uid !== auth?.currentUser?.uid);
        
        // Basic sort by name client-side to avoid index requirement errors
        validUsers.sort((a,b) => {
            const nameA = a.displayName || a.email || 'Unknown';
            const nameB = b.displayName || b.email || 'Unknown';
            return nameA.localeCompare(nameB);
        });
        
        // Ensure Klaus AI is at the top
        if (!validUsers.find(u => u.uid === KLAUS_ID)) validUsers.unshift(KLAUS_USER);
        
        return validUsers;
    } catch (e) {
        console.error("Browse users failed", e);
        return [KLAUS_USER];
    }
}

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  if (!db || !auth) return [];
  if (!searchTerm || searchTerm.trim().length < 1) return [];
  
  const term = searchTerm.toLowerCase().trim();
  const usersRef = collection(db, 'users');
  
  try {
      // 1. Direct Handle Search
      if (term.startsWith('@')) {
          const qHandle = query(usersRef, where('handle', '==', term));
          const snapHandle = await getDocs(qHandle);
          if (!snapHandle.empty) return snapHandle.docs.map(d => ({ ...d.data(), uid: d.id } as User));
      }

      // 2. Fallback: Email or SearchName via client-side filtering of recent users
      // This is more robust than a single filtered query if indexes are missing
      const qFallback = query(usersRef, limit(300));
      const snapshot = await getDocs(qFallback);
      const allUsers = snapshot.docs.map(d => ({ ...d.data(), uid: d.id } as User));
      
      const filtered = allUsers.filter(u => {
           const sn = (u.searchName || '').toLowerCase();
           const dn = (u.displayName || '').toLowerCase();
           const em = (u.email || '').toLowerCase();
           const hn = (u.handle || '').toLowerCase();
           
           return sn.includes(term) || dn.includes(term) || em.includes(term) || hn.includes(term);
      });

      if (KLAUS_USER.displayName?.toLowerCase().includes(term)) filtered.push(KLAUS_USER);
      return filtered.filter(u => u.uid !== auth?.currentUser?.uid);

  } catch (error) {
     return [];
  }
};

export const getSuggestedUsers = async (): Promise<User[]> => {
    if(!db || !auth) return [];
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(50));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({...d.data(), uid: d.id} as User));
        const filtered = all.filter(u => u.uid !== auth?.currentUser?.uid && u.uid !== KLAUS_ID);
        return filtered.sort(() => Math.random() - 0.5).slice(0, 3);
    } catch { return []; }
}

// ... friend system ...

export const sendFriendRequest = async (targetUid: string) => {
    if(!db || !auth) return;
    const myUid = auth.currentUser!.uid;
    const targetRef = doc(db, 'users', targetUid);
    const myRef = doc(db, 'users', myUid);
    await setDoc(targetRef, { friendRequests: { incoming: arrayUnion(myUid) } }, { merge: true });
    await setDoc(myRef, { friendRequests: { outgoing: arrayUnion(targetUid) } }, { merge: true });
};

export const acceptFriendRequest = async (requesterUid: string) => {
    if(!db || !auth) return;
    const myUid = auth.currentUser!.uid;
    const myRef = doc(db, 'users', myUid);
    const reqRef = doc(db, 'users', requesterUid);
    await updateDoc(myRef, { 'friendRequests.incoming': arrayRemove(requesterUid), 'friends': arrayUnion(requesterUid) });
    await updateDoc(reqRef, { 'friendRequests.outgoing': arrayRemove(myUid), 'friends': arrayUnion(myUid) });
};

export const removeFriend = async (friendUid: string) => {
    if(!db || !auth) return;
    const myUid = auth.currentUser!.uid;
    await updateDoc(doc(db, 'users', myUid), { 'friends': arrayRemove(friendUid) });
    await updateDoc(doc(db, 'users', friendUid), { 'friends': arrayRemove(myUid) });
};

export const getFriendsList = async (friendUids: string[] | undefined): Promise<User[]> => {
    if(!db || !friendUids || !Array.isArray(friendUids) || friendUids.length === 0) return [];
    const users: User[] = [];
    const validUids = friendUids.filter(id => typeof id === 'string' && id.trim().length > 0);
    for(const uid of validUids) {
        const u = await getUserProfile(uid);
        if(u) users.push(u);
    }
    return users;
};

// ... subscribeToUserProfile, updateUserProfile, uploadProfileImage ...

export const subscribeToUserProfile = (uid: string, callback: (user: User | null) => void) => {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'users', uid), (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...docSnap.data(), uid: uid } as User);
    } else {
      callback(null);
    }
  }, (error) => callback(null));
};

export const updateUserProfile = async (uid: string, data: Partial<User> & { telegramHandle?: string }) => {
  if (!db || !auth) throw new Error("Firebase not initialized");
  if (data.displayName !== undefined && data.displayName.trim() === '') throw new Error("Display Name cannot be empty.");

  const userRef = doc(db, 'users', uid);
  const updateData: any = { ...data, email: auth.currentUser.email, uid: uid };
  if (data.displayName) updateData.searchName = data.displayName.toLowerCase().trim();

  await setDoc(userRef, cleanData(updateData), { merge: true });
  if (auth.currentUser && (data.displayName || data.photoURL)) {
    await updateProfile(auth.currentUser, { displayName: data.displayName || auth.currentUser.displayName, photoURL: data.photoURL || auth.currentUser.photoURL }).catch(e => console.warn(e));
  }
  syncProfileToSupabase({ ...data, uid });
};

export const uploadProfileImage = async (file: File): Promise<string> => {
  if (!storage || !auth) throw new Error("Firebase not initialized");
  const storageRef = ref(storage, `profiles/${auth.currentUser!.uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// ... chat services (createChat, hideChat) ...

export const createChat = async (participants: User[], groupName?: string): Promise<string> => {
  if (!db || !auth) throw new Error("Firebase not initialized");
  const me = auth.currentUser;
  if (!me) throw new Error("Not authenticated");
  const userDoc = await getDoc(doc(db, 'users', me.uid));
  let myData = userDoc.exists() ? (userDoc.data() as User) : { uid: me.uid, email: me.email, displayName: me.displayName || 'Unknown', photoURL: me.photoURL, statusState: 'online', isOnline: true } as User;
  
  const allParticipants = [myData, ...participants];
  const validParticipants = allParticipants.filter(p => p && p.uid);
  const participantIds = validParticipants.map(p => p.uid).sort();

  if (participants.length === 1) {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', '==', participantIds), where('isGroup', '==', false), where('communityId', '==', null));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return snapshot.docs[0].id;
  }

  const newChatRef = await addDoc(collection(db, 'chats'), {
    participants: participantIds,
    participantDetails: validParticipants,
    isGroup: participants.length > 1,
    groupName: groupName || null,
    createdAt: serverTimestamp(),
    createdBy: me.uid,
    lastUpdated: serverTimestamp(),
    communityId: null 
  });
  return newChatRef.id;
};

export const hideChat = async (chatId: string) => {
    if (!db || !auth) return;
    const uid = auth.currentUser.uid;
    const chatRef = doc(db, 'chats', chatId);
    getDoc(chatRef).then(async (chatDoc) => {
        if(chatDoc.exists()) {
            const data = chatDoc.data();
            const newParticipants = (data.participants as string[]).filter(p => p !== uid);
            if (newParticipants.length === 0) await deleteDoc(chatRef);
            else await updateDoc(chatRef, { participants: newParticipants });
        }
    }).catch(console.error);
}

export const subscribeToChats = (userId: string, callback: (chats: ChatRoom[]) => void) => {
  if (!db || !userId) { callback([]); return () => {}; }
  
  // ROBUST QUERY: Only filter by participants array-contains.
  // Avoids orderBy('lastUpdated') which fails without composite index.
  // Sorting is done client-side.
  const qSimple = query(collection(db, 'chats'), where('participants', 'array-contains', userId));

  return onSnapshot(qSimple, (snapshot) => {
      const chats = snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          lastMessage: data.lastMessage ? { ...data.lastMessage, createdAt: data.lastMessage.createdAt || Date.now() } : undefined
        } as ChatRoom;
      })
      .filter((chat: ChatRoom) => !chat.communityId); 
      
      chats.sort((a: ChatRoom, b: ChatRoom) => {
          const timeA = a.lastMessage?.createdAt || a.createdAt || 0;
          const timeB = b.lastMessage?.createdAt || b.createdAt || 0;
          return timeB - timeA;
      });
      callback(chats);
  }, (error) => {
      console.error("Chat subscription error:", error);
      callback([]);
  });
};

export const subscribeToMessages = (chatId: string, callback: (msgs: Message[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    if (document.hidden && msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg.senderId !== auth?.currentUser?.uid && (Date.now() - lastMsg.createdAt < 5000)) sendNotification(lastMsg.senderName, lastMsg.text);
    }
    callback(msgs);
  });
};

export const sendMessage = async (chatId: string, message: Partial<Message>) => {
  if (!db || !auth) throw new Error("Firebase not initialized");
  const chatRef = collection(db, 'chats', chatId, 'messages');
  const chatDocRef = doc(db, 'chats', chatId);
  
  const fullMessage: Message = { ...message, senderId: auth.currentUser!.uid, senderName: auth.currentUser!.displayName || 'Unknown', createdAt: Date.now(), readBy: [auth.currentUser!.uid] } as Message;

  await addDoc(chatRef, fullMessage);
  await updateDoc(chatDocRef, { lastMessage: fullMessage, lastUpdated: serverTimestamp() });

  const chatDoc = await getDoc(chatDocRef);
  const chatData = chatDoc.data();
  
  if (chatData && chatData.participants && chatData.participants.includes(KLAUS_ID)) {
      const isDirectKlausChat = !chatData.communityId;
      const isMentioned = message.text?.toLowerCase().includes('@klaus') || message.text?.toLowerCase().includes('klaus');
      if (message.senderId !== KLAUS_ID && (isDirectKlausChat || isMentioned)) generateKlausResponse(chatId, message.text || '');
  }
};

export const findOrCreateKlausChat = async (): Promise<string | null> => {
    if (!auth || !auth.currentUser || !db) return null;
    const uid = auth.currentUser.uid;
    try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', uid));
        const snap = await getDocs(q);
        const existing = snap.docs.find(d => {
            const data = d.data();
            const parts = data.participants as string[];
            return parts.includes(KLAUS_ID) && parts.length === 2 && !data.communityId;
        });
        if (existing) return existing.id;
        return await createChat([KLAUS_USER]);
    } catch (e) {
        console.error("Failed to init Klaus chat", e);
        return null;
    }
}

// ... community services (createCommunity, updateCommunity, etc) ...

export const createCommunity = async (name: string, description: string, color?: string, isPublic?: boolean): Promise<string> => {
    if (!db || !auth) throw new Error("Database not connected");
    if (!auth.currentUser) throw new Error("Must be logged in");
    const uid = auth.currentUser.uid;
    const commRef = await addDoc(collection(db, 'communities'), {
        name, description, color: color || '#B30000', createdBy: uid, ownerId: uid, members: [uid], isPublic: !!isPublic, photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid), { joinedCommunities: arrayUnion(commRef.id) });
    createChannel(commRef.id, 'general').catch(e => console.warn(e));
    return commRef.id;
};

export const updateCommunity = async (id: string, data: Partial<Community>) => { if (!db || !auth) return; await updateDoc(doc(db, 'communities', id), data); }
export const getPublicCommunities = async (): Promise<Community[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'communities'), where('isPublic', '==', true), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Community));
    } catch (e) { return []; }
};

export const joinOfficialCommunity = async () => {
    if (!db || !auth) throw new Error("Not authenticated");
    const q = query(collection(db, 'communities'), where('name', '==', 'Official Klaus Community'));
    const snap = await getDocs(q);
    let commId;
    if (snap.empty) {
        commId = await createCommunity('Official Klaus Community', 'The central hub for all Klaus personnel.', '#B30000', true);
        await createChannel(commId, 'public-channel'); await createChannel(commId, 'announcements');
    } else {
        commId = snap.docs[0].id;
        await joinCommunity(commId);
    }
    return commId;
}

export const deleteCommunity = async (communityId: string) => {
    if(!db || !auth) return;
    const commRef = doc(db, 'communities', communityId);
    const commDoc = await getDoc(commRef);
    if(commDoc.exists() && commDoc.data().ownerId === auth.currentUser.uid) await deleteDoc(commRef);
}

export const subscribeToCommunities = (uid: string, callback: (comms: Community[]) => void) => {
    if(!db) return () => {};
    const q = query(collection(db, 'communities'), where('members', 'array-contains', uid));
    return onSnapshot(q, (snapshot) => { callback(snapshot.docs.map(d => ({id: d.id, ...d.data()} as Community))); }, () => callback([]));
};

export const createChannel = async (communityId: string, name: string) => {
    if(!db || !auth) throw new Error("No DB");
    await addDoc(collection(db, 'chats'), { isGroup: true, communityId, channelName: name, groupName: name, participants: [], participantDetails: [], createdAt: serverTimestamp(), lastUpdated: serverTimestamp() });
};

export const subscribeToChannels = (communityId: string, callback: (channels: ChatRoom[]) => void) => {
    if(!db) return () => {};
    const q = query(collection(db, 'chats'), where('communityId', '==', communityId));
    return onSnapshot(q, (snap) => { callback(snap.docs.map(d => ({id: d.id, ...d.data()} as ChatRoom))); });
};

export const joinCommunity = async (communityId: string) => {
    if (!db || !auth) return;
    const uid = auth.currentUser!.uid;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.joinedCommunities && userData.joinedCommunities.includes(communityId)) return;
    }
    await updateDoc(doc(db, 'communities', communityId), { members: arrayUnion(uid) });
    await updateDoc(doc(db, 'users', uid), { joinedCommunities: arrayUnion(communityId) });
};

export const leaveCommunity = async (communityId: string) => {
    if (!db || !auth) return;
    const commRef = doc(db, 'communities', communityId);
    const uid = auth.currentUser!.uid;
    getDoc(commRef).then(async (commDoc) => {
        if (!commDoc.exists()) return;
        const data = commDoc.data();
        const newMembers = (data.members as string[] || []).filter(m => m !== uid);
        await updateDoc(commRef, { members: newMembers });
        await updateDoc(doc(db, 'users', uid), { joinedCommunities: arrayRemove(communityId) });
    }).catch(console.error);
}

export const addMemberToCommunity = async (communityId: string, userId: string) => {
    if (!db || !auth) return;
    const commRef = doc(db, 'communities', communityId);
    await updateDoc(commRef, { members: arrayUnion(userId) });
}

export const getCommunityMembers = async (memberIds: string[]): Promise<User[]> => {
    if (!db || !memberIds || memberIds.length === 0) return [];
    const topMembers = memberIds.slice(0, 50); 
    const users: User[] = [];
    for (const uid of topMembers) { const u = await getUserProfile(uid); if (u) users.push(u); }
    return users;
};

// ... utils (notifications, telegram, media) ...
export const requestNotificationPermission = () => { if ('Notification' in window) Notification.requestPermission(); };
const sendNotification = (title: string, body: string) => { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' }); };

export const openTelegramChat = (handle: string) => {
    if(!handle) return;
    const cleanHandle = handle.replace('@', '').trim();
    if(cleanHandle) window.open(`https://t.me/${cleanHandle}`, '_blank');
};

const generateKlausResponse = async (chatId: string, userText: string) => {
  if (!db) return;
  console.log("Generating Klaus response for:", userText);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { role: 'user', parts: [{ text: userText }] },
      config: { systemInstruction: "You are Klaus, a chat AI with a persona inspired by German precision engineering and industrial design. You are efficient, direct, slightly formal but helpful. You value clarity, security, and structure. You are the embedded AI for the Klaus chat application. Your handle is @klaus_ai. Respond concisely.", }
    });
    const aiText = response.text;
    const klausMsg: Message = { id: 'klaus_' + Date.now(), senderId: KLAUS_ID, senderName: KLAUS_USER.displayName!, text: aiText || "Processing Error.", type: 'text', createdAt: Date.now(), readBy: [] } as Message;
    setTimeout(async () => {
        if (!db) return;
        await addDoc(collection(db, 'chats', chatId, 'messages'), klausMsg);
        await updateDoc(doc(db, 'chats', chatId), { lastMessage: klausMsg, lastUpdated: serverTimestamp() });
    }, 1500);
  } catch (error) { console.error("Klaus AI Error:", error); }
};

export const uploadMedia = async (file: File): Promise<string> => {
  if (!storage || !auth) throw new Error("Firebase not initialized");
  const storageRef = ref(storage, `uploads/${auth.currentUser!.uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

function mapFirebaseUser(u: FirebaseUser): User {
  return { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL, isOnline: true, statusState: 'online' };
}
