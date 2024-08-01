(async (window, d, undefined) => {

    const server_address = window.location.hostname + ':' + window.location.port;
    const client_id = uuidv4();

    function timerStart() { startTime = new Date(); }
    function elapsedTime() { if (!startTime) return 0; return (new Date() - startTime) / 1000; }
    function updateProgress(max=0, value=0) { _progress.max = max; _progress.value = value; }

    let IS_GENERATING = false;
    let uploadImageName = "";
    let startTime;

    const _maingen = document.getElementById('maingen')
    const _sendbutton = document.getElementById('sndbtn');
    const _colorway = document.getElementById('colorway');
    const _spinner = document.getElementById('spinner');
    const _progress = document.getElementById('main-progress');
    const _male = document.getElementById('male');
    const _resetbutton = document.getElementById('resetbtn');
    const _dllink = document.getElementById('dllink');
    const _imageinput = document.getElementById('imageInput');


    _imageinput.addEventListener("change", (event) => {
        const imageFile = event.target.files[0];
        uploadFile(imageFile);
    });

    function resetUI() {
        console.log("resetUI");
        _maingen.style.width = "1px";
        _dllink.style.display = "none";
        _resetbutton.style.display = "none";
    }

    function toggleDisplay(el, value=null) {
        if (value !== null) {
            el.style.display = (value === true) ? '' : 'none';
            return;
        }

        el.style.display = (el.style.display === 'none') ? '' : 'none';
    }

    // UUID generator
    function uuidv4() { return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }
    
    // Load the workflow
    async function loadWorkflow() {
        const response = await fetch('/comic/js/instantid_workflow.json');
        //const response = await fetch('/comic/js/transfer_workflow.json');
        return await response.json();
    }
    const workflow = await loadWorkflow();
    

    // WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(protocol + '//' + server_address + '/ws?clientId=' + client_id);
    socket.addEventListener('open', (event) => {
        console.log('Connected to the server');
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        if ( data.type === 'progress' ) {
            updateProgress(data['data']['max'], data['data']['value']);
            toggleDisplay(_spinner, IS_GENERATING);
        } else if (data.type === 'executed') {
            const execution_time = elapsedTime();
            console.log('Execution time: ' + execution_time + 's');
            if ('images' in data['data']['output']) {
                const images = data['data']['output']['images'];
                const grid = ( images.length > 1 ) ? ' class="uk-width-1-2"' : '';
                for (let i = 0; i < images.length; i++) {
                    
                    const filename = images[i]['filename']
                    const subfolder = images[i]['subfolder']
                    const rand = Math.random();
                   
                    _maingen.src = '/view?filename=' + filename + '&type=output&subfolder=' + subfolder + '&rand=' + rand;
                    _maingen.style.width = '400px';

                    _dllink.href = '/view?filename=' + filename + '&type=output&subfolder=' + subfolder + '&rand=' + rand;

                    toggleDisplay(_spinner, IS_GENERATING);

                    // TODO: fix below
                    _dllink.style.display = "block";
                    _resetbutton.style.display = "block";
                }
            }
        } else if (data.type === 'execution_interrupted') {
            console.log('Execution Interrupted');
            // TODO: react to this..
        } else if (data.type === 'status') {
            IS_GENERATING = (data['data']['status']['exec_info']['queue_remaining'] > 0) ? true : false;

            // TODO: combine
            toggleDisplay(spinner, IS_GENERATING)
            updateProgress();
        }
    });

    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };

        const response = await fetch('/prompt', {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    async function checkPrompt () {

        const radioButtons = document.querySelectorAll('input[name="option"]');

        let sex = "Male ";
        let currentPrompt = "Male Fortnite character, vibrant, highly detailed";
        let negPrompt = "photograph, deformed, glitch, noisy, ugly, cropped";

        console.log("male character: " + _male.checked);

        if (! _male.checked ) {
            sex = "Female"
        }

        radioButtons.forEach(radioButton => {
            if (radioButton.checked) {
                switch (radioButton.value) {
                    case '1':
                        currentPrompt = sex + "Fortnite character, vibrant, highly detailed";
                        //negPrompt = "deformed, glitch, noisy, ugly, cropped";
                        break;
                    case '2':
                        currentPrompt = sex + "super hero, comic character. graphic illustration, comic art, graphic novel art, vibrant, highly detailed";
                        //negPrompt = "deformed, glitch, noisy, ugly, cropped";
                        break;
                    case '3':
                        currentPrompt = sex + "soccer fan celebrating a tournament win";
                        //negPrompt = "deformed, glitch, noisy, ugly, cropped";
                        break;
                    default:
                        break;
                }
            }
        });
       
        workflow["39"]["inputs"]["text"] = currentPrompt.replace(/(\r\n|\n|\r)/gm, " ");
        workflow["40"]["inputs"]["text"] = negPrompt.replace(/(\r\n|\n|\r)/gm, " ");
        workflow["13"]["inputs"]["image"] = uploadImageName;
        workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 9999999999);

        queue_prompt(workflow);
        console.log(workflow)
    }

    async function uploadFile(file, pasted = false) {
        try {

            const body = new FormData();
            body.append("image", file);
            if (pasted) body.append("subfolder", "pasted");
            const resp = await fetch("/upload/image", {
                method: "POST",
                body,
            });

            if (resp.status === 200) {
                const data = await resp.json();
                console.log("uploadFile, Status 200::: ");
                console.log(data.name);
                uploadImageName = data.name;               
            } else {
                console.log(resp.status + " - " + resp.statusText);
            }
        } catch (error) {
            alert(error);
        }
    }


    // Event listeners
    _sendbutton.addEventListener('click', async (event) => {
        checkPrompt();
    });

    _resetbutton.addEventListener('click', async (event) => {
        resetUI();
    });

    resetUI();


})(window, document, undefined);

