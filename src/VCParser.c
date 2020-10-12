#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include "VCParser_A2temp.h"

//if the uppercase string1 is equal to uppercase string2, return 0
//if the lengths are not equal, return 25
//if the strings have the same length but are not equal, return 1
int compare(char *string1, char *string2)
{
    if (strlen(string1) != strlen(string2))
    {
        return 25;
    }

    for (int i = 0; i < strlen(string1); i++)
    {
        if (toupper(string1[i]) != toupper(string2[i]))
        {
            return 1;
        }
    }

    return 0;
}

bool checkExtension(char *filename)
{
    char *extension = strrchr(filename, '.');

    if (extension == NULL)
    {
        return false;
    }

    if (compare(extension, ".vcf") == 0 || compare(extension, ".vcard") == 0)
    {
        return true;
    }
    return false;
}

char *readFile(char *fileName)
{
    char *txt;

    FILE *fptr = NULL;
    fptr = fopen(fileName, "r");
    if (fptr == NULL)
    {
        // perror("Error opening file!");
        return NULL;
    }

    fseek(fptr, 0, SEEK_END);
    int length = ftell(fptr);
    fseek(fptr, 0, SEEK_SET);
    txt = malloc(length);

    if (length == 0)
    {
        free(txt);
        fclose(fptr);
        return NULL;
    }

    if (txt)
    {
        fread(txt, 1, length, fptr);
    }
    fclose(fptr);

    length -= 1;
    for (int i = 0; i < length - 3; i++)
    {
        if (txt[i] == '\n' && (txt[i + 1] == ' ' || txt[i + 1] == '\t'))
        {
            memmove(&txt[i], &txt[i + 1], length - i);
            memmove(&txt[i], &txt[i + 1], length - i);
            memmove(&txt[i - 1], &txt[i], length - i - 1);

            length -= 3;
        }
    }
    txt[length] = '\0';
    return txt;
}

char *trim(char *str)
{
    int i;
    const char *seps = "\t\n\v\f\r ";

    i = strlen(str) - 1;
    while (i >= 0 && strchr(seps, str[i]) != NULL)
    {
        str[i] = '\0';
        i--;
    }
    return str;
}

char *substring(char *string, int start, int end)
{
    int len = end - start + 2;
    char *sub = malloc(len);
    int count = 0;
    for (int i = start; i <= end; i++)
    {
        sub[count] = string[i];
        count++;
    }
    sub[len - 1] = '\0';
    return trim(sub);
}

int curProcess(char *contentLine)
{
    if (compare(contentLine, "BEGIN:VCARD") == 0)
    {
        return 1;
    }
    else if (compare(contentLine, "END:VCARD") == 0)
    {
        return 2;
    }
    else
    {
        return 0;
    }
}

int count(char *text, char *toFind)
{
    int start = 0;
    int count = 0;
    for (int i = 0; i < strlen(text); i++)
    {
        if (text[i] == '\n' || text[i + 1] == '\0')
        {
            char *contentLine = substring(text, start, i);
            if (strcmp(contentLine, toFind) == 0)
            {
                count++;
            }
            start = i + 1;
            free(contentLine);
        }
    }
    return count;
}

bool checkDate(char *string)
{
    if (string[strlen(string) - 1] == 'z' || string[strlen(string) - 1] == 'Z')
    {
        return true;
    }
    else
    {
        return false;
    }
}

bool checkText(Property *prop)
{
    List *params = prop->parameters;
    Node *paramNode = params->head;
    for (int i = 0; i < params->length; i++)
    {
        Parameter *param = paramNode->data;
        if (strcmp(param->name, "VALUE") == 0 && strcmp(param->value, "text") == 0)
        {
            return true;
        }
        paramNode = paramNode->next;
    }
    return false;
}

//Takes a line from VCF and puts puts the appropriate date-time or Property into the Card
VCardErrorCode processProp(Card *thecard, char *contentLine, int *DATE, int *ANNIVERSARY, int *FN)
{
    char *part;  // for holding groups
    char *part2; // for holding names
    char *part3; // for holding parameters
    char *part4; // for holding values

    //Splitting into values
    if (strchr(contentLine, ':') != NULL)
    {
        for (int i = 0; i < strlen(contentLine); i++)
        {
            if (contentLine[i] == ':')
            {
                part2 = substring(contentLine, 0, i - 1);
                part4 = substring(contentLine, i + 1, strlen(contentLine));
                break;
            }
        }
    }
    else
    {
        return INV_PROP;
    }

    //Splitting into parameters
    if (strchr(part2, ';') != NULL)
    {
        for (int i = 0; i < strlen(part2); i++)
        {
            if (part2[i] == ';')
            {
                char *temp = malloc(strlen(part2) + 1);
                strcpy(temp, part2);
                part3 = substring(part2, i + 1, strlen(part2));
                free(part2);
                part2 = substring(temp, 0, i - 1);
                free(temp);
                break;
            }
        }
    }
    else
    {
        part3 = malloc(2);
        strcpy(part3, "");
    }

    //splitting into groups
    if (strchr(part2, '.') != NULL)
    {
        for (int i = 0; i < strlen(part2); i++)
        {
            if (part2[i] == '.')
            {
                char *temp = malloc(strlen(part2) + 1);
                strcpy(temp, part2);
                part = substring(part2, 0, i - 1);
                free(part2);
                part2 = substring(temp, i + 1, strlen(temp));
                free(temp);
                break;
            }
        }
    }
    else
    {
        part = malloc(2);
        strcpy(part, "");
    }

    //Working on Properties
    Property *prop = malloc(sizeof(Property));
    prop->group = part;
    prop->name = part2;
    prop->values = initializeList(&valueToString, &deleteValue, &compareValues);
    prop->parameters = initializeList(&parameterToString, &deleteParameter, &compareParameters);

    //Get the parameters for all contentline
    char *token = strtok(part3, ";");
    while (token != NULL)
    {
        if (strchr(token, '=') == NULL)
        {
            free(part3);
            free(part4);
            deleteProperty(prop);
            return INV_PROP;
        }
        Parameter *param = malloc(sizeof(Parameter));
        for (int i = 0; i < strlen(token); i++)
        {
            if (token[i] == '=')
            {
                param->name = substring(token, 0, i - 1);
                param->value = substring(token, i + 1, strlen(token));

                if (strcmp(param->name, "") == 0 || strcmp(param->value, "") == 0)
                {
                    free(part3);
                    free(part4);
                    deleteParameter(param);
                    deleteProperty(prop);
                    return INV_PROP;
                }

                insertBack(prop->parameters, param);
                break;
            }
        }

        token = strtok(NULL, ";");
    }

    //Getting all values from contentline
    int start = 0;

    for (int i = 0; i < strlen(part4); i++)
    {
        if (part4[i] == ';' || part4[i + 1] == '\0')
        {
            char *value = substring(part4, start, i);

            if (value[0] == ';')
            {
                char *string = malloc(2);
                strcpy(string, "");
                insertBack(prop->values, string);
            }
            else
            {
                if (value[strlen(value) - 1] == ';')
                {
                    value[strlen(value) - 1] = '\0';
                }
                char *string = malloc(strlen(value) + 1);
                strcpy(string, value);
                insertBack(prop->values, string);
            }

            start = i + 1;
            free(value);
        }
    }

    if ((strcmp(prop->name, "") == 0 || prop->values->length == 0) && strcmp(prop->name, "END") != 0)
    {
        free(part3);
        free(part4);
        deleteProperty(prop);
        return INV_PROP;
    }

    if (compare(part2, "ANNIVERSARY") != 0 && compare(part2, "BDAY") != 0)
    {
        if (compare(prop->name, "FN") == 0)
        {
            if ((*FN) == 0)
            {
                thecard->fn = prop;
                (*FN)++;
            }
            else
            {
                insertBack(thecard->optionalProperties, prop);
            }
        }
        else
        {
            if (compare(prop->name, "VERSION") != 0)
            {
                insertBack(thecard->optionalProperties, prop);
            }
            else
            {
                deleteProperty(prop);
            }
        }
    }
    // working on DateTime
    else
    {
        DateTime *date = malloc(sizeof(DateTime));
        date->UTC = checkDate(part4);
        date->isText = checkText(prop);

        char *values = (char *)prop->values->head->data;

        if (date->isText)
        {
            date->text = malloc(strlen(values) + 1);
            strcpy(date->text, values);

            date->date = malloc(2);
            date->time = malloc(2);
            strcpy(date->date, "");
            strcpy(date->time, "");
        }
        else
        {
            date->text = malloc(2);
            strcpy(date->text, "");

            if (strchr(values, 'T') == NULL)
            {
                date->time = malloc(2);
                strcpy(date->time, "");

                date->date = malloc(strlen(values) + 1);
                strcpy(date->date, values);
            }
            else
            {
                for (int i = 0; i < strlen(values); i++)
                {
                    if (values[i] == 'T')
                    {
                        date->date = substring(values, 0, i - 1);
                        date->time = substring(values, i + 1, strlen(values));
                    }
                }
            }
        }

        if (compare(part2, "ANNIVERSARY") == 0)
        {
            if ((*ANNIVERSARY) == 0)
            {
                thecard->anniversary = date;
                (*ANNIVERSARY)++;
                deleteProperty(prop);
            }
            else
            {
                insertBack(thecard->optionalProperties, prop);
                deleteDate(date);
            }
        }
        else
        {
            if ((*DATE) == 0)
            {
                thecard->birthday = date;
                (*DATE)++;
                deleteProperty(prop);
            }
            else
            {
                insertBack(thecard->optionalProperties, prop);
                deleteDate(date);
            }
        }
    }
    free(part4);
    free(part3);
    return OK;
}

VCardErrorCode createCard(char *fileName, Card **newCardObject)
{

    if (fileName == NULL || strcmp(fileName, "") == 0 || !checkExtension(fileName))
    {
        return INV_FILE;
    }
    char *text = readFile(fileName);

    if (text == NULL)
    {
        return INV_FILE;
    }
    int start = 0;
    int end = 0;
    Card *theCard;
    int begin = 0;
    int process = 0;
    int FN = 0;
    int ANNIVERSARY = 0;
    int DATE = 0;

    for (int i = 0; i < strlen(text); i++)
    {
        if ((text[i] == '\n' && text[i - 1] == '\r') || text[i + 1] == '\0')
        {
            char *contentLine = substring(text, start, i);
            int seen = curProcess(contentLine);

            if (seen == 1)
            {
                begin = 1;
                theCard = malloc(sizeof(Card));
                theCard->fn = NULL;
                theCard->optionalProperties = initializeList(&propertyToString, &deleteProperty, &compareProperties);
                theCard->birthday = NULL;
                theCard->anniversary = NULL;
            }
            else if (seen == 2)
            {
                end = 1;
                *newCardObject = theCard;
                free(contentLine);
                break;
            }
            else
            {
                process++;
                if (begin == 0)
                {
                    free(contentLine);
                    free(text);
                    return INV_CARD;
                }

                if (process == 1 && strcmp(contentLine, "VERSION:4.0"))
                {
                    free(contentLine);
                    free(text);
                    deleteCard(theCard);
                    return INV_CARD;
                }

                VCardErrorCode code = processProp(theCard, contentLine, &DATE, &ANNIVERSARY, &FN);

                if (code != OK)
                {
                    deleteCard(theCard);
                    free(contentLine);
                    free(text);
                    return code;
                }
            }

            start = i + 1;
            free(contentLine);
        }
        else
        {
            // deleteCard(theCard);
            // free(text);
            // return INV_PROP;
        }
    }

    // if(theCard->fn == NULL){
    //     deleteCard(theCard);
    //     free(text);
    //     return INV_CARD;
    // }

    if (end == 0 || theCard->fn == NULL)
    {
        deleteCard(theCard);
        free(text);
        return INV_CARD;
    }

    free(text);
    return OK;
}

void deleteCard(Card *obj)
{
    Card *temp;

    if (obj == NULL)
    {
        return;
    }

    temp = (Card *)obj;
    deleteProperty(temp->fn);
    deleteDate(temp->birthday);
    deleteDate(temp->anniversary);
    freeList(temp->optionalProperties);
    free(temp);
}

char *cardToString(const Card *obj)
{
    char *tempStr;
    Card *theCard;
    int len;

    if (obj == NULL)
    {
        char *ret = malloc(6);
        strcpy(ret, "NULL");
        return ret;
    }
    theCard = (Card *)obj;
    char *fn = propertyToString(theCard->fn);
    char *bday = dateToString(theCard->birthday);
    char *anni = dateToString(theCard->anniversary);
    char *optional = toString(theCard->optionalProperties);

    int fnLen = fn != NULL ? strlen(fn) : 0;
    int bdayLen = bday != NULL ? strlen(bday) : 0;
    int anniLen = anni != NULL ? strlen(anni) : 0;
    int optionalLen = optional != NULL ? strlen(optional) : 0;

    len = fnLen + bdayLen + anniLen + optionalLen + 90;
    tempStr = malloc(len);

    sprintf(tempStr, "FN:\n%s\nBirthday:\n\n%s\n\nAnniversary:\n%s\n\nLIST OF OPTIONAL PROPERTIES:%s", fn, bday, anni, optional);
    free(fn);
    free(bday);
    free(anni);
    free(optional);
    return tempStr;
}

char *errorToString(VCardErrorCode err)
{
    if (err > 6 || err < 0)
    {
        char *ret = malloc(20);
        strcpy(ret, "Invalid Error Code");
        return ret;
    }

    char *ERRORSTRING[] = {"OK", "INV_FILE", "INV_CARD", "INV_PROP", "INV_DT", "WRITE_ERROR", "OTHER_ERROR"};
    char *ret = malloc(strlen(ERRORSTRING[err]) + 1);
    strcpy(ret, ERRORSTRING[err]);
    return ret;
}

// *************************************************************************

// ************* List helper functions - MUST be implemented ***************
void deleteProperty(void *toBeDeleted)
{
    Property *temp;

    if (toBeDeleted == NULL)
    {
        return;
    }

    temp = (Property *)toBeDeleted;
    free(temp->name);
    free(temp->group);
    freeList(temp->parameters);
    freeList(temp->values);
    free(temp);
}

int compareProperties(const void *first, const void *second)
{
    return 0;
}

char *propertyToString(void *prop)
{
    char *tempStr;
    Property *theProp;
    int len;

    if (prop == NULL)
    {
        char *ret = malloc(6);
        strcpy(ret, "NULL");
        return ret;
    }
    theProp = (Property *)prop;

    char *paramString = toString(theProp->parameters);
    char *valueString = toString(theProp->values);

    int paramLen = paramString != NULL ? strlen(paramString) : 0;
    int valueLen = valueString != NULL ? strlen(valueString) : 0;

    len = strlen(theProp->name) + strlen(theProp->group) + paramLen + valueLen + 70;
    tempStr = malloc(len);

    sprintf(tempStr, "Group: %s, Name: %s \nList of Parameters \n%s\nList of Values\n%s", theProp->group, theProp->name, paramString, valueString);
    free(paramString);
    free(valueString);
    return tempStr;
}

void deleteParameter(void *toBeDeleted)
{
    Parameter *temp;

    if (toBeDeleted == NULL)
    {
        return;
    }

    temp = (Parameter *)toBeDeleted;
    free(temp->name);
    free(temp->value);
    free(temp);
}

int compareParameters(const void *first, const void *second)
{
    return 0;
}

char *parameterToString(void *param)
{
    char *tempStr;
    int len;
    Parameter *theParam;

    if (param == NULL)
    {
        char *ret = malloc(6);
        strcpy(ret, "NULL");
        return ret;
    }

    theParam = (Parameter *)param;

    len = strlen(theParam->value) + strlen(theParam->name) + 30;
    tempStr = malloc(len);

    sprintf(tempStr, "name: %s, value: %s", theParam->name, theParam->value);

    return tempStr;
}

void deleteValue(void *toBeDeleted)
{
    char *temp;
    if (toBeDeleted == NULL)
    {
        return;
    }
    temp = toBeDeleted;
    free(temp);
}

int compareValues(const void *first, const void *second)
{
    return 0;
}

char *valueToString(void *val)
{
    char *values;

    if (val == NULL)
    {
        char *ret = malloc(6);
        strcpy(ret, "NULL");
        return ret;
    }

    values = (char *)val;
    int len = strlen(val) + 15;
    values = malloc(len);

    sprintf(values, "value: %s", (char *)val);

    return values;
}

void deleteDate(void *toBeDeleted)
{
    DateTime *temp;

    if (toBeDeleted == NULL)
    {
        return;
    }

    temp = (DateTime *)toBeDeleted;
    free(temp->date);
    free(temp->text);
    free(temp->time);
    free(temp);
}

int compareDates(const void *first, const void *second)
{
    return 0;
}

char *dateToString(void *date)
{
    DateTime *theDate;
    char *tempStr;
    int len;

    if (date == NULL)
    {
        char *ret = malloc(6);
        strcpy(ret, "NULL");
        return ret;
    }
    theDate = (DateTime *)date;

    char *UTC = malloc(6);
    if (theDate->UTC)
    {
        strcpy(UTC, "True");
    }
    else
    {
        strcpy(UTC, "False");
    }

    len = strlen(theDate->date) + strlen(theDate->time) + strlen(theDate->text) + 50;
    tempStr = malloc(len + 50);
    if (theDate->isText)
    {
        sprintf(tempStr, "UTC: %s, isText: true, Text : %s", UTC, theDate->text);
    }
    else
    {
        sprintf(tempStr, "UTC: %s, isText: false, Date : %s, Time : %s", UTC, theDate->date, theDate->time);
    }

    free(UTC);

    return tempStr;
}

// void function(int *a){
//     (*a)++;
// }

VCardErrorCode writeCard(const char *fileName, const Card *obj)
{
    if (obj == NULL || fileName == NULL || strcmp(fileName, "") == 0)
    {
        return WRITE_ERROR;
    }
    FILE *fptr;

    fptr = fopen("card.vcf", "w");

    if (fptr == NULL)
    {
        printf("Error!");
        return WRITE_ERROR;
    }

    fprintf(fptr, "%s", "BEGIN:VCARD\r\n");
    fprintf(fptr, "%s", "VERSION:4.0\r\n");

    // Working on FN
    Property *fn = obj->fn;
    if (strcmp(fn->group, "") != 0)
    {
        fprintf(fptr, "%s%c", fn->group, '.');
    }

    fprintf(fptr, "%s", fn->name);

    void *fn_value;
    ListIterator iter = createIterator(fn->values);
    int count = 0;
    while ((fn_value = nextElement(&iter)) != NULL)
    {
        char c = ';';
        if (count == 0)
        {
            c = ':';
            count++;
        }
        fprintf(fptr, "%c%s", c, (char *)fn_value);
    }
    fprintf(fptr, "%s", "\r\n");

    // Working on BirthDay
    DateTime *birthDay = obj->birthday;
    fprintf(fptr, "%s", "BDAY:");
    if (birthDay->isText)
    {
        fprintf(fptr, "%s%s", birthDay->text, "\r\n");
    }
    else
    {
        if (strcmp(birthDay->time, "") == 0)
        {
            fprintf(fptr, "%s", birthDay->date);
        }else{
            fprintf(fptr, "%sT%s", birthDay->date, birthDay->time);
        }

        if(birthDay->UTC){
            fprintf(fptr, "%s", "Z\r\n");
        }else{
            fprintf(fptr, "%s", "\r\n");
        }
    }

    // Working on Anniversary
    DateTime *anniversary = obj->anniversary;
    fprintf(fptr, "%s", "ANNIVERSARY:");
    if (anniversary->isText)
    {
        fprintf(fptr, "%s%s", anniversary->text, "\r\n");
    }
    else
    {
        if (strcmp(anniversary->time, "") == 0)
        {
            fprintf(fptr, "%s", anniversary->date);
        }else{
            fprintf(fptr, "%sT%s", anniversary->date, anniversary->time);
        }

        if(anniversary->UTC){
            fprintf(fptr, "%s", "Z\r\n");
        }else{
            fprintf(fptr, "%s", "\r\n");
        }
    }

    // Working on List of Optional Properties
    Property *property;
    List *properties = obj->optionalProperties;
    ListIterator propertyIter = createIterator(properties);
    while ((property = nextElement(&propertyIter)) != NULL)
    {
        //group
        if (strcmp(property->group, "") != 0)
        {
            fprintf(fptr, "%s%c", property->group, '.');
        }
        //name
        fprintf(fptr, "%s", property->name);

        //parameters
        Parameter *param;
        ListIterator paramIter = createIterator(property->parameters);
        while ((param = nextElement(&paramIter)) != NULL)
        {
            fprintf(fptr, "%c%s=%s", ';', param->name, param->value);
        }

        //values
        void *prop_value;
        ListIterator iterVal = createIterator(property->values);
        int i = 0;
        while ((prop_value = nextElement(&iterVal)) != NULL)
        {
            char c = ';';
            if (i == 0)
            {
                c = ':';
                i++;
            }
            fprintf(fptr, "%c%s", c, (char *)prop_value);
        }

        fprintf(fptr, "%s", "\r\n");
    }

    fprintf(fptr, "%s", "END:VCARD");
    fclose(fptr);

    return OK;
}

int main()
{
    // printf("%s \n",errorToString(INV_CARD));
    Card *theCard = NULL;
    char *error = errorToString(createCard("testCard.vcf", &theCard));
    writeCard("Hello", theCard);
    // printf("%s \n\n\n\n\n\n\n", error);

    // if (compare(error, "OK") == 0)
    // {
    // char *text = cardToString(theCard);
    // printf("%s", text);
    // free(text);
    // }

    if (compare(error, "OK") == 0)
    {
        deleteCard(theCard);
    }

    free(error);
    return 0;
}