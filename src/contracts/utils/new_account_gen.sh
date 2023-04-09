#!/bin/bash

AMOUNT=1000000000000000

accountList=$( ./sandbox goal account list )
accountArray=(${accountList//\t/ })

mainAcc="${accountArray[-3]}"

echo "Collected main account ${mainAcc} with balance ${accountArray[-2]}"

newAccountStr=$( ./sandbox goal account new )
IFS='\ ' read -a newAcc <<< "$newAccountStr"

echo "Created new account ${newAcc[-1]}"

./sandbox goal clerk send -a ${AMOUNT} -t ${newAcc[-1]} -f ${mainAcc}

echo "Funded account ${newAcc[-1]} with ${AMOUNT} MicroALGOS"
./sandbox goal account list