$file = 'e:\ims full stack\ims-fullstack\frontend-build\static\js\main.1d1ae619.js'
$content = [System.IO.File]::ReadAllText($file)
$original = $content

# 1. Also destructure 'auth' from auth context in sidebar component
$old1 = 'u=(0,Iu.n)(),{currentUser:h}=(0,Nd.aC)()'
$new1 = 'u=(0,Iu.n)(),{currentUser:h,auth:qmAuth}=(0,Nd.aC)()'
if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host 'Replaced auth context destructure'
} else {
    Write-Host 'ERROR: auth context destructure not found'
}

# 2. Change Trainer condition to also fall back to qmAuth.companyId
$old2 = '"Trainer"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)'
$new2 = '"Trainer"===(null===h||void 0===h?void 0:h.role)&&e._id===((null===h||void 0===h?void 0:h.companyId)||(null===qmAuth||void 0===qmAuth?void 0:qmAuth.companyId))'
if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host 'Replaced Trainer companyId condition with auth fallback'
} else {
    Write-Host 'ERROR: Trainer companyId condition not found'
}

if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host 'File written successfully'
} else {
    Write-Host 'No changes made'
}
