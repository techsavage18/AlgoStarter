import { toast} from "react-hot-toast";
import { claimFundstAction, createProjectAction, deleteProjectAction, deployEscrowAndUpdateProjectAction, fundProjectAndOptInAction, refundUserAction } from "./crowdfunding";
import { firestoreGetProjectAction, firestoreInsertInfoAction, firestoreDonateAction} from "./firebase";
import {crowdfundingProject} from './crowdfunding';
import algosdk, { microalgosToAlgos } from "algosdk";


export const createProject = async (sender, data) => {
    let project = new crowdfundingProject(
        data.name, data.image, data.description, 
        data.goal, data.start, data.end, sender.address, data.isSponsored)    
        
    // First create the crowdfunding project
    createProjectAction(sender.address, project)
        .then((appId) => {
            project.appId = appId
            // Then deploy and fund the connected escrow address
            deployEscrowAndUpdateProjectAction(sender.address, appId).then((escrow) => {
            project.escrow = escrow.toString()
            console.log(project.escrow)
            // Then insert all the information in the firestore database
            }).then(() => firestoreInsertInfoAction(project)).then(() =>
                {toast.success("Project created successfully!", {
                position: 'bottom-center'});
        })}).catch(error => {
            console.log(error);
            toast.error("Could not create the project", {
                position: 'bottom-center'
            });
        });
};

export const deleteProject = async (sender, appId) => {
    let project = await firestoreGetProjectAction(appId.toString());
    let escrowUInt8 = Uint8Array.from(project.escrow.split(',').map(x=>parseInt(x,10)))
    let escrow = new algosdk.LogicSigAccount(escrowUInt8)

    deleteProjectAction(sender, escrow, {appId: appId}).then(() => {
        project.deleted = true
        firestoreInsertInfoAction(project).then(()=>
            toast.success("Project deleted successfully!", {
                position: 'bottom-center'}
        ))}).catch(error => {
            console.log(error);
            toast.error("Could not delete the project", {
                position: 'bottom-center'
            });
        });
};


export const donateToProject = async (sender, project, amount) => {
    amount = algosdk.algosToMicroalgos(parseInt(amount));
    let escrowUInt8 = Uint8Array.from(project.escrow.split(',').map(x=>parseInt(x,10)))
    let escrow = new algosdk.LogicSigAccount(escrowUInt8)

    fundProjectAndOptInAction(sender, escrow, project, amount).then(()=>
        firestoreDonateAction(sender, project.appId, amount).then(() =>
            toast.success("Donation completed successfully!", {
                position: 'bottom-center'})
        )).catch(error => {
            console.log(error);
            toast.error("Could not donate to the project", {
                position: 'bottom-center'
            });
        });
};

export const claimFundsFromProject = async(sender, project) => {
    let escrowUInt8 = Uint8Array.from(project.escrow.split(',').map(x=>parseInt(x,10)))
    let escrow = new algosdk.LogicSigAccount(escrowUInt8)

    claimFundstAction(sender, escrow, project).then(() =>{
        project.claimed = true
        firestoreInsertInfoAction(project).then(() =>
        toast.success("Successfully claimed the donations!", {
            position: 'bottom-center'})
        )}).catch(err => {
            console.log(err);
            toast.error("Could not claim the funds", {
                position: 'bottom-center'
            });});
};

export const askRefundFromProject = async(sender, project) => {
    let escrowUInt8 = Uint8Array.from(project.escrow.split(',').map(x=>parseInt(x,10)))
    let escrow = new algosdk.LogicSigAccount(escrowUInt8)

    refundUserAction(sender, escrow, project).then((amount) =>{
        firestoreDonateAction(sender, project.appId, -microalgosToAlgos(amount)).then(() =>
        toast.success("Refund obtained successfully!", {
            position: 'bottom-center'})
        )}).catch(error =>{
            console.log(error);
            toast.error("Could not obtain a refund", {
                position: 'bottom-center'
        });});
};