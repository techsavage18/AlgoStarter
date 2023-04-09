

import {useCallback, useState} from "react";
import PropTypes from "prop-types";
import {MDBBtn, MDBCol, MDBRow} from "mdb-react-ui-kit";
import { Container, Form, FloatingLabel } from "react-bootstrap";
import {algosToMicroAlgos} from "../../utils/conversions";


const CreateProjectForm = ({createProject}) => {
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [description, setDescription] = useState("");
    const [goal, setGoal] = useState(0);
    const [isSponsored, setIsSponsored] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("00:00")
    const [endTime, setEndTime] = useState("00:00")

    const address = window.sessionStorage.getItem("address")

    const toggleSponsor = () => setIsSponsored(!isSponsored)

    const getDate = (date, time) => {
        let dateInMillisecond = new Date(date + "T" + time).getTime()
        return (Math.floor(dateInMillisecond / 1000))
    }

    const isFormFilled = useCallback(() => {
        return name && description && goal > 0 && startDate && endDate
    }, [name, description, goal, startDate, endDate]);

    console.log(address, typeof address)

    return (
        <>
    <div className="text-center text-light">
        <h2>Create new crowdfunding project</h2>
        <p>Get funding for your next great idea</p>
        </div>
        <Container style={{width: "50vw"}}>
    <Form>
        <FloatingLabel controlId="inputName" label="Project name" className="mb-3 text-light">
            <Form.Control className="text-light" style={{backgroundColor: "transparent"}} type="text" onChange={(e) => {setName(e.target.value);}} placeholder="Enter project name"/>
        </FloatingLabel>

        <FloatingLabel controlId="inputDes" label="Description" className="mb-3 text-light">
            <Form.Control 
            className="text-light"
            as="textarea" 
            placeholder="Add an awsome description for your project"
            rows={10}
            style={{ height: '30vh', backgroundColor: "transparent"}}
            onChange={e => {
            setDescription(e.target.value);}}/>
        </FloatingLabel>
        <MDBRow>
            <MDBCol className="md-8">
                <FloatingLabel controlId="inputImgUrl" label="Image URL" className="mb-3 text-light">
                <Form.Control className="text-light" style={{backgroundColor: "transparent"}} type="text" onChange={(e) => {setImage(e.target.value);}} placeholder="Enter URL for you cover image"/>
                </FloatingLabel>
            </MDBCol>
            <MDBCol className="md-4">
                <FloatingLabel controlId="inputGoal" label="Goal in ALGO" className="mb-3 text-light">
                <Form.Control type="number" onChange={e => {setGoal(algosToMicroAlgos(e.target.value));}} min={0} style={{backgroundColor: "transparent"}} className="text-light" placeholder="10"/>
                </FloatingLabel>
            </MDBCol>
        </MDBRow>
        <MDBRow>
            <MDBCol className="md-4">
                <FloatingLabel controlId="inputGoal" label="Start Date" className="mb-3 text-light">
                <Form.Control type="date" onChange={e => {setStartDate(e.target.value); console.log(getDate(e.target.value, "00:00"))}} style={{backgroundColor: "transparent"}} className="text-light" placeholder="2022-10-25"/>
                </FloatingLabel>
            </MDBCol>
            <MDBCol className="md-4">
                <FloatingLabel controlId="inputGoal" label="Start Time" className="mb-3 text-light">
                <Form.Control type="time" onChange={e => {setStartTime(e.target.value)}} style={{backgroundColor: "transparent"}} className="text-light" placeholder="2022-10-25"/>
                </FloatingLabel>
            </MDBCol>
        </MDBRow>
        <MDBRow>
            <MDBCol className="md-4">
                <FloatingLabel controlId="inputGoal" label="End Date" className="mb-3 text-light">
                <Form.Control type="date" onChange={e => {setEndDate(e.target.value)}} style={{backgroundColor: "transparent"}} className="text-light" placeholder="2022-10-25"/>
                </FloatingLabel>
            </MDBCol>
            <MDBCol className="md-4">
                <FloatingLabel controlId="inputGoal" label="End Time" className="mb-3 text-light">
                <Form.Control type="time" onChange={e => {setEndTime(e.target.value)}} style={{backgroundColor: "transparent"}} className="text-light" placeholder="2022-10-25"/>
                </FloatingLabel>
            </MDBCol>
        </MDBRow>

        <Form.Check 
        className="text-light"
        type="switch"
        id="custom-switch"
        label="Yes, I want premium subscription to publicize my project. I consent to paying a 3% fee when creating the project."
        onClick={toggleSponsor}
        />

        <div className="d-flex justify-content-end pb-3">
         <MDBBtn
            color="primary"
            disabled={!isFormFilled()}
            onClick={(e) => {
                e.preventDefault()
                let start = getDate(startDate, startTime);
                let end = getDate(endDate, endTime)
                
                createProject({address}, {name, image, description, goal, start, end, isSponsored});
                }}>
                    Save project
        </MDBBtn>
        </div>
    </Form>
    </Container>
    </>
    );
};

CreateProjectForm.propTypes = {
    createProject: PropTypes.func.isRequired
};

export default CreateProjectForm;