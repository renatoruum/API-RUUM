// Constants
const API_ENDPOINT = "https://b6fb-191-205-248-153.ngrok-free.app/webhook";
const TABLE_NAME = "DEVELOPMENT Test API";
const FIELD_IMAGE_URL = "URL imagem input";  // Field to store the generated URL
const FIELD_ATTACHMENT = "Imagem input";  // Attachment field
const FIELD_ROOM_TYPE = "Ambiente";

// Utility: Fetch record from Airtable
async function fetchRecord(table, recordId, fields) {
    const record = await table.selectRecordAsync(recordId, { fields });
    if (!record) throw new Error(`Record with ID ${recordId} not found.`);
    return record;
}

// Utility: Validate required fields
function validateFields(imageUrl, roomType) {
    if (!imageUrl || imageUrl.trim() === "") {
        throw new Error("No valid image URL found.");
    }
    if (!roomType) {
        throw new Error("'roomType' is missing or invalid.");
    }
}

// Utility: Log errors consistently
function logError(message, error) {
    console.error(message, error?.message || error);
}

// Main function
async function processImage(input) {
    try {
        const table = base.getTable(TABLE_NAME);
        const inputConfig = input.config();
        const recordId = inputConfig.record_id;

        if (!recordId) {
            throw new Error("'record_id' is missing in the input configuration.");
        }

        console.log("Record ID:", recordId);

        // Fetch the record
        const record = await fetchRecord(table, recordId, [FIELD_ATTACHMENT, FIELD_ROOM_TYPE]);

        // Extract Room Type
        const roomType = record.getCellValue(FIELD_ROOM_TYPE)?.name?.trim();

        // Get the Expiring Download URL from the first attachment
        const attachments = record.getCellValue(FIELD_ATTACHMENT);
        if (!attachments || attachments.length === 0) {
            throw new Error("No attachments found in the record.");
        }

        const imageUrl = attachments[0].url; // Extract the Expiring Download URL
        console.log("Generated Expiring Download URL:", imageUrl);

        // Update the record with the generated URL
        await table.updateRecordAsync(recordId, {
            [FIELD_IMAGE_URL]: imageUrl
        });

        console.log("URL successfully saved to Airtable.");

        // Immediately proceed with the API request using the generated URL
        validateFields(imageUrl, roomType);

        console.log(`Final Image URL: ${imageUrl}`);
        console.log(`Fetched Room Type: ${roomType}`);

        // Prepare API request
        const headers = {
            "Content-Type": "application/json",
        };

        const body = JSON.stringify({
            image_url: imageUrl,
            room_type: roomType.toLowerCase(), // Ensure room type matches API expected format
            style: "standard",
            wait_for_completion: false,
        });

        // Send the API request
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers,
            body,
        });

        if (response.ok) {
            const data = await response.json();
            console.log("API Response:", data);
        } else {
            const errorText = await response.text();
            throw new Error(`API Request Failed: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        logError("Error processing image:", error);
    }
}

// Trigger the function
processImage(input);
