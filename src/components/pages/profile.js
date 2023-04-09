import React, {useState, useEffect} from 'react';
import { Accordion, Container } from 'react-bootstrap';
import { ProjectList } from '../projectCard';
import { MDBIcon } from 'mdb-react-ui-kit';
import { firestoreGetCreatedProjectsAction, firestoreGetFundedProjectsAction } from '../../utils/firebase';
import Loader from '../utils/loader';

function NoProjectsHere ({text}) {
  return (
    <div className='d-flex flex-column justify-content-center align-items-center' style={{minHeight: "39vh"}}>
                <MDBIcon fas icon="exclamation-circle" className='text-muted' size='6x'/>
      <p className='text-muted pt-3'>{text}</p>
      </div>
  );
}

function UserProfile() {
    const address = window.sessionStorage.getItem("address")

    const [createdList, setCreatedList] = useState([]);
    const [fundedList, setFundedList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const getCreatedProjects = async () => {
        setLoading(true);
        firestoreGetCreatedProjectsAction(address).then(
          projects => setCreatedList(projects)).catch(
            error => console.log(error)
          ).finally(_ => setLoading(false))
      }

      getCreatedProjects();
    }, []);

    useEffect(() => {
      const getFundedProjects = async () => {
        setLoading(true);
        firestoreGetFundedProjectsAction(address).then(
          projects => setFundedList(projects)).catch(
            error => console.log(error)
          ).finally(_ => setLoading(false))
      }

      getFundedProjects();
    },[]);
    

  return (
    <Container className='pt-5' style={{width:"75vw", minHeight:"70vh"}}>
      {loading? (<Loader/>) :(
        <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0" style={{backgroundColor:'transparent'}}>
        <Accordion.Header>Projects you created</Accordion.Header>
        <Accordion.Body>
            {createdList.length > 0 ? (<ProjectList projects={createdList} address={address} useTitle={false} action='claim'/>):(
            <NoProjectsHere text='You have not started any crowdunding campaign yet!'/>
            )}
        </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1" style={{backgroundColor:'transparent'}}>
        <Accordion.Header>Projects you funded</Accordion.Header>
        <Accordion.Body>
          {fundedList.length > 0? (<ProjectList address={address} projects={fundedList} useTitle={false} action='refund'/>):(
            <NoProjectsHere text='You have not contributed to any campaign yet!' />
          )}
            
        </Accordion.Body>
        </Accordion.Item>
    </Accordion> )}
  </Container>
  );
}

export default UserProfile;