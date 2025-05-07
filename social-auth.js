const config= {
    google:{

        //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

        clientId:'498753384898-prdi8ornqolrpsgfn2k8pj7t6opjpiat.apps.googleusercontent.com',
        redirectUri:"http://127.0.0.1:5500/callback.html/"
    },
    facebook:{
        clientId:'',
        redirectUri:""
    }
}

function openPopup(url, width=500, height=600){
    const left = (window.innerWidth-width)/2;
    const right = (window.innerHeight-height)/2;
    return window.open(url, 'Social Login', `width=${width}, height=${height}, left=${left}, right=${right}`);
}

function initGoogleSignIn(){
    const googleButton = document.querySelector('.social-buttotn[title="Login with Google"]');
    if(googleButton){
        googleButton.addEventListener('click', ()=>{
            const authUrl = `https://accounts.google.com/o/oauth2/va/auth?`+
            `client_id=${config.google.clientId}`+
            `&redirect_url=${encodeURIComponent(config.google.redirectUri)}`+
            `&response_type=code`+
            `&scope=${encodeURIComponent('email profile')}`+
            `&access_type=offline`+
            `&prompt=consent`;

            const popup = openPopup(authUrl);
            if(popup){
                window.addEventListener('message', handleGoogleCallback);
            }
        })
    }
}

function handleGoogleCallback(event){
    if(event.origin!==window.location.origin){
        return;
    }
    if(event.data.type == 'google-auth-success'){
        const{code, userData}=event.data;
        handleSocialLoginSuccess('google', code, userData)
    }
}

async function handleSocialLoginSuccess(provider, code, userData) {
    try{
        const loadingOverlay = document.getElementById('loading-overlay');
        if(loadingOverlay){
            loadingOverlay.style.display=flex;
        }

        const requestData = {
            provider : provider,
            code : code,
            userData : {
                email : userData.email
            }
        };

        const response = await fetch('http://localhost:8080/api/auth/social-login',{

            method: 'POST',
            headers: {
                'Content-Type':'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if(!response.ok){
            throw new Error('Failed to process Social Login');
        }

        const data = await response.json();

        if(data.token){
            localStorage.setItem('userData', JSON.stringify({
                id:data.user.id,
                email:data.user.email
            }));
            window.location.href = '/index.html';
        }else{
            throw new Error('No user data received');
        }
    }catch(error){
        console.error('Social login error: ',error);
        showError('Failed to complete social login please try again');
    }finally{
        if(loadingOverlay){
            loadingOverlay.style.display='none';
        }
    }
}

function showError(message){
    const errorElement = document.getElementById('error-message');
    if(errorElement){
        errorElement.textContent=message;
        errorElement.style.display='block';
        setTimeout(()=>{
            errorElement.style.display='none';
        },5000);
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    initGoogleSignIn();
    initFacebookSignIn();
})