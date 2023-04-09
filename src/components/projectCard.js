import React, { useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import {
  ProgressBar,
  Button
} from 'react-bootstrap';

import {
    MDBCardTitle,
    MDBCardText,
    MDBCardBody,
    MDBCardImage,
    MDBRow,
    MDBCol,
    MDBCardSubTitle,
    MDBContainer
  } from 'mdb-react-ui-kit';

import { DonateButton } from './donateButton';
import imgProd from '../assets/img/tree_lights.jpg'
import { microAlgosToString } from '../utils/conversions';
import { askRefundFromProject, claimFundsFromProject, deleteProject } from '../utils/projectActions';
import { BadgeList } from './utils/badgeList';

function ProjectCardNotLoggedIn({project, ...props}) {
  return (
    <div>
    <MDBContainer style={{ maxWidth: '100%', backgroundColor:'transparent'}}>
        <MDBRow className='g-0 align-items-center' style={{overflow: 'hidden'}}>
          <MDBCol className='justify-content-center' lg='4' sm='12' style={{overflow: 'hidden', maxHeight: 200}}>
            <MDBCardImage className='ml-5' src={project.image.length > 0 ? project.image: imgProd} alt='...' style={{objectFit: 'cover', width:"100%", height:'auto'}}/>
          </MDBCol>
          <MDBCol lg='8'>
            <MDBCardBody>
              <MDBRow className="align-items-baseline justify-content-end p-0 m-0">
                <MDBCol md='6' className='p-0 m-0 pe-1'>
                <MDBCardTitle className='text-light fs-4'>{project.name}</MDBCardTitle>
                <MDBCardSubTitle className='text-light text-muted'>Goal: {microAlgosToString(project.goal)} ALGO</MDBCardSubTitle>
                </MDBCol>
                <MDBCol md='6' className='p-0 m-0 pb-1'>
                  <BadgeList project={project}/>
                </MDBCol>
              </MDBRow>
              <MDBCardText className='text-light max-lines'>
                {project.description}
              </MDBCardText>
            <ProgressBar 
                variant='primary' 
                now={project.current_amount} 
                max={project.goal} 
                label={microAlgosToString(project.current_amount) + " ALGO"} 
                style={{height:20, borderRadius:10}}/>
            </MDBCardBody>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
      </div>
  )
}

  
function ProjectCard({project, action, address, ...props}) {

  let navigate = useNavigate();
  const goToProject = () => {
    let path = `/projects/` + project.appId.toString();
    navigate(path);
  };

  const deleteThisProject = async () => {
    await deleteProject(address, project.appId);
  };

  const lightButtonAction = action === 'claim'? deleteThisProject : goToProject
  const lightButtonText = action === 'claim'? 'Delete': 'Info'

  const projectCannotBeDeleted = useCallback(() => {
    return (project.deleted && action === 'claim') || (action==='claim' && (Date.now() / 1000) < project.endDate)
  }, [project, action]);

    return (
        <div>
    <MDBContainer style={{ maxWidth: '100%', backgroundColor:'transparent'}}>
        <MDBRow className='g-0 align-items-center' style={{overflow: 'hidden'}}>
          <MDBCol className='justify-content-center' lg='4' sm='12' style={{overflow: 'hidden', maxHeight: 200}}>
            <MDBCardImage className='ml-5' src={project.image.length > 0 ? project.image: imgProd} alt='...' style={{objectFit: 'cover', width:"100%", height:'auto'}}/>
          </MDBCol>
          <MDBCol lg='8'>
            <MDBCardBody>
              <MDBRow className="align-items-baseline justify-content-end p-0 m-0">
                <MDBCol md='6' className='p-0 m-0 pe-1'>
                <MDBCardTitle className='text-light fs-4'>{project.name}</MDBCardTitle>
                <MDBCardSubTitle className='text-light text-muted'>Goal: {microAlgosToString(project.goal)} ALGO</MDBCardSubTitle>
                </MDBCol>
                <MDBCol md='6' className='p-0 m-0 pb-1'>
                  <BadgeList project={project}/>
                </MDBCol>
              </MDBRow>
              <MDBCardText className='text-light max-lines'>
                {project.description}
              </MDBCardText>
            <ProgressBar 
                variant='primary' 
                now={project.current_amount} 
                max={project.goal} 
                label={microAlgosToString(project.current_amount) + " ALGO"} 
                style={{height:20, borderRadius:10}}/>
            <MDBRow className="align-items-baseline justify-content-end pt-3 m-0">
            <MDBCol md='4' className="text-center pb-2">
                <Button variant='outline-light' style={{minWidth: '130px'}} disabled={projectCannotBeDeleted()} onClick={lightButtonAction}>{lightButtonText}</Button>
            </MDBCol>
            <MDBCol md='4' className="text-center">
                <ProjectActionButton action={action} project={project} address={address}/>
            </MDBCol>
            </MDBRow>             
            </MDBCardBody>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
      </div>
    );
  }

function ProjectActionButton({action, project, address}){
  
  const isRefundOk = useCallback(() => {
    return (Date.now() / 1000) > project.endDate && project.current_amount < project.goal && !project.deleted
  }, [project]);

  const isClaimOk = useCallback(() => {
    return (Date.now() / 1000) > project.endDate && project.current_amount >= project.goal && !project.deleted && !project.claimed
  }, [project]);

  return(
    action === 'donate'? (
      <DonateButton project={project} sender={address}>Donate</DonateButton>
    ):(action === 'refund' ? (
      <Button 
          variant='primary' 
          style={{minWidth: '130px'}} 
          disabled={!isRefundOk()} 
          onClick={() => askRefundFromProject(address, project)}>Ask Refund</Button>): (
      <Button 
          variant='primary' 
          style={{minWidth: '130px'}} 
          disabled={!isClaimOk()} 
          onClick={() => claimFundsFromProject(address, project)}>Claim Funds</Button>
    ))
  )
}

export function ProjectList({projects, address, useTitle = true, action='donate'}){
  let listLength = projects.length -1
  return(
    <MDBContainer 
    className='justify-content-center pt-3' 
    style={{
      //border: "1px solid rgba(136, 153, 166, 2)", 
      borderRadius:"15px 15px 0px 0px", 
      borderBottom: "none"}}>
        {useTitle? (<h3 className="text-center font-title text-light" style={{fontSize: "40px"}}><b>All our projects</b></h3>): (<></>)}
      {projects.map((project, index) =>(
        <div  key={index}>
        <ProjectCard project={project} action={action} address={address}/>
        {index !== listLength? (<hr  style={{ backgroundColor: 'rgba(255, 255, 255, 2)'}}/>): (<></>)}
        </div>
      ))}
  </MDBContainer>
)}

export function ProjectListNotLoggedIn({projects}) {
  let listLength = projects.length -1
  return(
    <MDBContainer 
    className='justify-content-center pt-3' 
    style={{
      borderRadius:"15px 15px 0px 0px", 
      borderBottom: "none"}}>
        <h3 className="text-center font-title text-light" style={{fontSize: "40px"}}><b>All our projects</b></h3>
      {projects.map((project, index) =>(
        <div  key={index}>
        <ProjectCardNotLoggedIn project={project}/>
        {index !== listLength? (<hr  style={{ backgroundColor: 'rgba(255, 255, 255, 2)'}}/>): (<></>)}
        </div>
      ))}
  </MDBContainer>
)}