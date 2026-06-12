$file = 'e:\ims full stack\ims-fullstack\frontend-build\static\js\main.1d1ae619.js'
$content = [System.IO.File]::ReadAllText($file)
$original = $content

# Replace 3 Counsellor conditions to also exclude Trainer
$old1 = '"Counsellor"!==(null===h||void 0===h?void 0:h.role)'
$new1 = '"Counsellor"!==(null===h||void 0===h?void 0:h.role)&&"Trainer"!==(null===h||void 0===h?void 0:h.role)'
$content = $content.Replace($old1, $new1)
$matchCount = ([regex]::Matches($content, [regex]::Escape($new1))).Count
Write-Host "Counsellor+Trainer conditions now present: $matchCount"

# Replace company display condition to add Trainer branch and exclude Trainer from catch-all
$old2 = '"Company"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)||"SuperAdmin"!==(null===h||void 0===h?void 0:h.role)&&"Company"!==(null===h||void 0===h?void 0:h.role)&&'
$new2 = '"Company"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)||"Trainer"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)||"SuperAdmin"!==(null===h||void 0===h?void 0:h.role)&&"Company"!==(null===h||void 0===h?void 0:h.role)&&"Trainer"!==(null===h||void 0===h?void 0:h.role)&&'
if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host 'Replaced company display condition'
} else {
    Write-Host 'ERROR: company display condition not found'
}

if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host 'File written successfully'
} else {
    Write-Host 'No changes made'
}
