import { initializeApp } from "firebase/app";
import {getFirestore} from "@firebase/firestore"
import {addDoc, setDoc, doc, collection, increment, updateDoc, getDoc, getDocs, query, where } from "@firebase/firestore"
import {crowdfundingProject} from './crowdfunding';
import { microalgosToAlgos } from "algosdk";

const firebaseConfig = {
  apiKey: "AIzaSyAhLulBeyBabjW6ghnTlIo2ul7RWOXbpQ8",
  authDomain: "crazy-ideas-crowdfunding.firebaseapp.com",
  projectId: "crazy-ideas-crowdfunding",
  storageBucket: "crazy-ideas-crowdfunding.appspot.com",
  messagingSenderId: "200585485171",
  appId: "1:200585485171:web:bc68e5ccefe1aa3a30c306",
  measurementId: "G-M6QZLNEE5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

const projectsCollection = collection(firestore, "projects");
const donationCollection = collection(firestore, "donations");

// Should be used for both create and update
export const firestoreInsertInfoAction = async(project) => {
    const collectionName = "projects"
    const document = doc(firestore, collectionName, project.appId.toString())
    setDoc(document, Object.assign({}, project), { merge: true }).then((res) => {
        console.log(res);
      }).catch((error) => {
        console.error(error);
      });
}

export const firestoreDonateAction = async(sender, appId, amount) => {
    const projDocument = doc(firestore, "projects", appId.toString())
    updateDoc(projDocument, {current_amount: increment(amount)}).then((res) => {
        console.log(res);
      }).catch((error) => {
        console.error(error);
      });
    addDoc(donationCollection, {
        sender: sender,
        appId: appId,
        amount: microalgosToAlgos(amount)
    }).then((res) => console.log(res)).catch(
        (error) => console.log(error)
    );
}

export const firestoreDeleteAction = async(project) => {
    const projDocument = doc(firestore, "projects", project.appId)
    updateDoc(projDocument, {deleted: true}).then(
        (res) => console.log(res)).catch((error) => console.log(error));
}

export const firestoreGetProjectAction = async(appId) => {
    const document = doc(firestore, "projects", appId.toString())
    const data = (await getDoc(document)).data()
    return new crowdfundingProject(
        data.name, data.image, data.description, data.goal, data.startDate, 
        data.endDate, data.creator, data.isSponsored, data.current_amount, 
        data.appId, data.escrow, data.deleted, data.claimed, data.platform);
}

export const firestoreGetAllProjectsAction = async() => {
    const snapshot = await getDocs(projectsCollection)
    return snapshot.docs.map(doc => {
        let data = doc.data()
        return new crowdfundingProject(
            data.name, data.image, data.description, data.goal, data.startDate, 
            data.endDate, data.creator, data.isSponsored, data.current_amount, 
            data.appId, data.escrow, data.deleted, data.claimed, data.platform)});
}

const firestoreGetProjectsForQuery = async (query) =>{
  const snapshot = await getDocs(query);
  return snapshot.docs.map(
    doc => {
      let data = doc.data()
      return new crowdfundingProject(
        data.name, data.image, data.description, data.goal, data.startDate, 
        data.endDate, data.creator, data.isSponsored, data.current_amount, 
        data.appId, data.escrow, data.deleted, data.claimed, data.platform)});
}

export const firestoreGetSponsoredProjectsAction = async() => {
  const sponsoredQuery = query(projectsCollection, where("isSponsored", '==', true));
  return await firestoreGetProjectsForQuery(sponsoredQuery);
}

export const firestoreGetFundedProjectsAction = async(address) => {
  const fundedQuery = query(donationCollection, where("sender", '==', address));
  const snapshot = await getDocs(fundedQuery)
  const appIds = snapshot.docs.map(doc => {
    console.log(doc.data())
    let data = doc.data();
    return data.appId});
  const queryProj = query(projectsCollection, where('appId', 'in', appIds));
  return await firestoreGetProjectsForQuery(queryProj);
}

export const firestoreGetCreatedProjectsAction = async(address) => {
  const createdQuery = query(projectsCollection, where('creator', '==', address));
  return await firestoreGetProjectsForQuery(createdQuery);
}

// TODO: add firebaseGetSponsoredProjectsAction, add firebaseGetFundedProjectAction, add firebaseGetCreatedProject action