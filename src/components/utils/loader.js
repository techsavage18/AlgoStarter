import { MDBSpinner} from "mdb-react-ui-kit";

const Loader = () => {
    return (
        <>
            <div className='d-flex flex-column justify-content-center align-items-center' style={{minHeight: "67vh"}}>
                <MDBSpinner color='light' style={{ width: '8rem', height: '8rem'}} />
                <strong className="text-light pt-3">Collecting projects...</strong>
            </div>
        </> 
    )
}

export default Loader;