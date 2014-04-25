@REM this builds the rs SWF from source
@REM using mxmlc from the Adobe open-source Flex SDK

C:\progra~1\FlashDevelop\Tools\flexsdk\bin\mxmlc -use-network=false -static-link-runtime-shared-libraries=true -optimize=true -o rs.swf -file-specs Rs.as
