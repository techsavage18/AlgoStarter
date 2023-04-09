import React, { useState, useCallback } from 'react';
import {
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput
} from 'mdb-react-ui-kit';
import { FloatingLabel, Form , Button} from 'react-bootstrap';
import { donateToProject } from '../utils/projectActions';

//<MDBInput label='ALGO' id='donateAmount' type='number' />

export function DonateButton({sender, project}) {
  const [donateModal, setDonateModal] = useState(false);
  const [donation, setDonation] = useState(0);

  const toggleShow = () => setDonateModal(!donateModal);

  const canDonate = useCallback(() => {
    return (Date.now()/1000) > project.startDate && !project.deleted && !project.claimed && (Date.now() / 1000) < project.endDate
  }, [project]);

  return (
    <>
     <Button style={{minWidth: '130px'}} color='primary' onClick={toggleShow} disabled={!canDonate()}>Donate</Button>
      <MDBModal show={donateModal} setShow={setDonateModal} tabIndex='-1'>
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>Donate to this project</MDBModalTitle>
              <MDBBtn className='btn-close' color='none' onClick={toggleShow}></MDBBtn>
            </MDBModalHeader>
            <MDBModalBody>
              <Form>
              <p> How many ALGO are you donating? </p>
              <FloatingLabel controlId="inputName" label="ALGO" className="mb-3">
              <Form.Control type="number" onChange={(e) => {setDonation(e.target.value);}} placeholder="10"  min={0}/>
              </FloatingLabel>
              </Form>
            </MDBModalBody>

            <MDBModalFooter>
              <MDBBtn outline color='primary' onClick={toggleShow}>
                Close
              </MDBBtn>
              <MDBBtn 
              color='primary' 
              disabled={!canDonate()}
              onClick={(e) => {
                e.preventDefault()
                console.log(sender)
                donateToProject(sender, project, donation);
              }}>Donate</MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
}