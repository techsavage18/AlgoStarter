import { MDBCardImage, MDBCol, MDBCardText, MDBCardTitle, MDBCardBody, MDBRow, MDBCardSubTitle, MDBContainer} from 'mdb-react-ui-kit';
import React, {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import { firestoreGetProjectAction } from '../../utils/firebase';
import Loader from '../utils/loader';
import img from '../../assets/img/tree_lights.jpg'
import { microalgosToAlgos } from 'algosdk';
import { ProgressBar } from 'react-bootstrap';
import { DonateButton } from '../donateButton';
import { microAlgosToString, truncateAddress } from '../../utils/conversions';
import { BadgeList } from '../utils/badgeList';

const ProjectPage = () => {
    const address = window.sessionStorage.getItem("address")

    let params = useParams();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProject = async () => {
            setLoading(true);
            firestoreGetProjectAction(params.pid).then(
                proj => setProject(proj)).catch(
                    error => console.log(error)
                ).finally(_ => setLoading(false));
        }

        getProject();
    }, []);

    return(
            loading? (
                <Loader/>
            ): ( 
                <MDBContainer className='mt-3 mb-0 bg-transparent'>
                <MDBRow className='g-0'>
                <MDBCol className='mt-4' md='4' style={{overflow: 'hidden', height: "65vh"}}>
                    <MDBCardImage src={project.image.length > 0 ? project.image: img} alt='...' fluid style={{objectFit: 'cover', width:"auto", height:'100%'}}/>
                </MDBCol>
                <MDBCol md='8'>
                    <MDBCardBody>
                    <MDBRow className="align-items-center justify-content-end p-0 m-0">
                        <MDBCol md='6' className='p-0 m-0 pe-1'>
                            <MDBCardTitle className='text-light fs-4'>{project.name}</MDBCardTitle>
                            <MDBCardSubTitle className='text-muted text-light'>Created by {truncateAddress(project.creator)}</MDBCardSubTitle>
                            <MDBCardSubTitle className='text-light'><small>Goal: {microalgosToAlgos(project.goal)} ALGO</small></MDBCardSubTitle>
                        </MDBCol>
                        <MDBCol md='6' className='p-0 m-0'>
                            <BadgeList project={project} />
                        </MDBCol>
                    </MDBRow>
                    <hr/>
                    <MDBCardText className='text-light'>
                        {project.description}
                    </MDBCardText>
                    <MDBContainer className='text-light pb-3'>
                       ⚠️The project's fundraising ends on {new Date(project.endDate * 1000).toLocaleString()}. Hurry up if you want to contribute!
                        Amount raised so far:
                        <ProgressBar variant='primary' now={project.current_amount} max={project.goal} label={microAlgosToString(project.current_amount)+ " ALGO"} style={{height:20, borderRadius:10, color:'black'}}/>
                    </MDBContainer>
                    <div className='d-flex justify-content-end'>
                    <DonateButton project={project} sender={address}>Donate</DonateButton>
                    </div>
                    </MDBCardBody>
                </MDBCol>
                </MDBRow>
                </MDBContainer>
    ))}

export default ProjectPage;