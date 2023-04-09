import React from 'react';
import {
  MDBFooter,
  MDBContainer,
  MDBCol,
  MDBRow,
  MDBIcon,
  MDBBtn
} from 'mdb-react-ui-kit';

export function Footer() {
  return (
    <MDBFooter className='text-center pb-0' style={{backgroundColor: "#263238", borderTop: "1px solid light"}} >
      <div className='text-center text-light pb-0 pt-2' >
        Made with ❤️ by <a className='text-light' href='https://github.com/techsavage18'>AlgoStarter Team <MDBIcon fab icon="github" className='text-light'/></a>
    </div>
    <MDBContainer className='pb-1 pt-1 text-muted text-light'>
        <p style={{fontSize: "13px"}}>
          Designed in Algorand Hyderabad Hackathon
        </p>
        </MDBContainer>
    </MDBFooter>
  );
}