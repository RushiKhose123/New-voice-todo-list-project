document.addEventListener('DOMContentLoaded', ()=>{
    const userData = localStorage.getItem('userData');
    if(userData){
        window.location.href = "index.html";
    }
})

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authButton = document.getElementById('auth-button');
const toggleAuthLink = document.getElementById('toggle-auth-link');
const errorMessage = document.getElementById('error-message');

let isLoginMode = true;

toggleAuthLink.addEventListener('click', (e) =>{
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode? 'Login' : 'SignUp';
    authButton.textContent = isLoginMode? 'Login' : 'SignUp';
    toggleAuthLink.textContent = isLoginMode? "Dont have an account Sign Up?" : "Already have an account? Login";
});

function setDataTOLocalStorage(user){
    const userDataJsonString = JSON.stringify(user);
    localStorage.setItem("userData", userDataJsonString);
}


authForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try{
        const endPoint = isLoginMode? 'api/auth/login': 'api/auth/signup';
        const jwtToken = await generateJWT(email, password, isLoginMode ? 'user' : 'admin');
        const response = await fetch(`http://localhost:8080${endpoint}`,{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
                'Accept' : 'application/json',
                'Authorization':`Bearer ${jwtToken}`,
            },
            //body: JSON.stringify({email,password})
        });
        if(!response.ok){
            let errorMessage;
            try{
                const errorData = await response.json();
                errorMessage = errorData.message || 'Authentication failed';
            } catch(e){
                errorMessage = response.statusText || 'Authentication failed';
            } throw{
                message : errorMessage,
                status : response.status
            }
            
           
        }
        const data = await response.json();

        localStorage.setItem('userData', JSON.stringify(data));

        window.location.href = 'index.html';
    }catch(error){
        showErrorAuth(error.message, error.status);
    }
});

function showError(message){
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

function generateJWT(email, password, role){
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const payload = {
        email: email,
        password: password,
        role: role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60*60)
    };

    const privateKey = ``;

    try{
        const sHeader = JSON.stringify(header);
        const sPayload = JSon.stringify(payload);
        const sJWT = KJUR.jws.JWS.sign("RS256", sHeader, sPayload, privateKey);
        return sJWT;
    }catch(error){
        console.error('error generating JWT:', error);
        throw error;
    }
   

    //const signature = signUsingRSA(encodeHeaders+ ","+ encodePayload, key);
}

function showErrorAuth(error, statusCode){
    let errorMessageText;
    switch(statusCode){
        case 400:
            errorMessageText = 'Invalid request, please check input';
            break;
        case 400:
            errorMessageText = 'Invalid credentials, please verify';
            break;
        case 500:
            errorMessageText = 'Invalid request, please check input';
            break;
        default:
            errorMessageText = 'An unexpected error occured please try again later';
    }

    const variable = document.getElementById('error-message');
    if(variable){
        variable.textContent = errorMessageText;
        console.log(error);
        variable.style.display='block';
        setTimeout(()=>{
            variable.style.display='none';
        },3000);
    }
}