#define _GNU_SOURCE
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "../include/VCParser.h"

char *readFile(char *fileName)
{
    char *txt;

    FILE *fptr = NULL;
    fptr = fopen(fileName, "r");
    if (fptr == NULL)
    {
        perror("Error opening file!");
        return NULL;
    }

    fseek(fptr, 0, SEEK_END);
    int length = ftell(fptr);
    fseek(fptr, 0, SEEK_SET);
    txt = malloc(length);
    if (txt)
    {
        fread(txt, 1, length, fptr);
    }
    fclose(fptr);

    length -= 1;
    for (int i = 0; i < length - 2; i++)
    {
        if (txt[i] == '\n' && txt[i + 1] == ' ')
        {
            memmove(&txt[i], &txt[i + 1], length - i);
            memmove(&txt[i - 1], &txt[i], length - i - 1);
            length -= 2;
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
    if (strcmp(contentLine, "BEGIN:VCARD") == 0)
    {
        return 1;
    }
    else if (strcmp(contentLine, "END:VCARD") == 0)
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

void processGroup(Property *theProp, char *subString)
{
}

void processValue(Property *theProp, char *subString)
{
    // char *token = strtok(subString, "=");

    //     while (token != NULL)
    //     {

    // printf("%s \n", token);
    //         token = strtok(NULL, " ");
    //     }
}

void processParam(Property *theProp, char *subString)
{
}
//Takes a line from VCF and puts puts the appropriate date-time or Property into the Card
void processProp(Card *thecard, char *contentLine)
{
    char *part;
    char *part2;
    char *part3;
    char *part4;

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

    // printf("1 -> %s \n", part);
    // printf("2 -> %s \n", part2);
    // printf("3 -> %s \n", part3);
    // printf("4 -> %s \n\n", part4);

    //Wokring on Properties
    if (strcmp(part2, "anniversary") != 0 && strcmp(part2, "birthday") != 0)
    {
        Property *prop = malloc(sizeof(Property));
        prop->group = part;
        prop->name = part2;
        prop->values = initializeList(&valueToString, &deleteValue, &compareValues);
        prop->parameters = initializeList(&parameterToString, &deleteParameter, &compareParameters);

        //Get the parameters for all contentline
        char *end_str;
        char *token = strtok_r(part3, ";", &end_str);
        while (token != NULL)
        {
            Parameter *param = malloc(sizeof(Parameter));
            char *end_token;
            char *token2 = strtok_r(token, "=", &end_token);
            while (token2 != NULL)
            {
                param->name = malloc(strlen(token2) + 1);
                strcpy(param->name, token2);
                // printf("name = %s\n", param->name);

                token2 = strtok_r(NULL, "=", &end_token);
                param->value = malloc(strlen(token2) + 1);
                strcpy(param->value, token2);
                // printf("value = %s\n", param->value);
                insertBack(prop->parameters, param);
                break;
            }

            token = strtok_r(NULL, ";", &end_str);
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
                    printf("empty value \n");
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
                    printf("%s \n", value);
                }

                start = i + 1;
                free(value);
            }
        }
        printf("\n");
        free(part4);
        free(part3);

        if(strcmp(prop->name, "FN") == 0){
            thecard->fn = prop;
        }else{
            insertBack(thecard->optionalProperties, prop);
        }
        deleteProperty(prop);
    }
    else
    {
    }

    // free(part);
    // free(part2);
    // free(part3);
    // free(part4);
}

VCardErrorCode createCard(char *fileName, Card **newCardObject)
{

    if (fileName == NULL)
    {
        fprintf(stderr, "No file entered! Exiting...\n");
        return INV_FILE;
    }
    char *text = readFile(fileName);
    newCardObject = malloc(sizeof(Card));

    int start = 0;
    Card *theCard;
    for (int i = 0; i < strlen(text); i++)
    {
        if (text[i] == '\n' || text[i + 1] == '\0')
        {
            char *contentLine = substring(text, start, i);
            int seen = curProcess(contentLine);

            if (seen == 1)
            {
                theCard = malloc(sizeof(Card));
                theCard->optionalProperties = initializeList(&propertyToString, &deleteProperty, &compareProperties);
            }
            else if (seen == 2)
            {
                *newCardObject = theCard;
            }
            else
            {
                processProp(theCard, contentLine);
            }

            start = i + 1;
            free(contentLine);
        }
    }

    // deleteCard(theCard);
    free(theCard);
    // freeList(theCard->optionalProperties);
    free(newCardObject);
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

    return NULL;
}

char *errorToString(VCardErrorCode err)
{
    char *ERRORSTRING[] = {"OK", "INV_FILE", "INV_CARD", "INV_PROP", "INV_DT", "WRITE_ERROR", "OTHER_ERROR"};
    return ERRORSTRING[err];
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
    return NULL;
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
    return NULL;
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
    return NULL;
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
    return NULL;
}

int main()
{
    Card **theCard = NULL;
    createCard("testCard.vcf", theCard);
    // char *text = malloc(sizeof("VERSION:4.0"));
    // processProp(*theCard, "VERSION:4.0");
    return 0;
}