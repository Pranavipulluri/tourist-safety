// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TouristDigitalId {
    struct Tourist {
        string firstName;
        string lastName;
        string passportNumber;
        string nationality;
    }

    mapping(address => Tourist) public tourists;

    function createTourist(
        string memory _firstName,
        string memory _lastName,
        string memory _passportNumber,
        string memory _nationality
    ) public {
        tourists[msg.sender] = Tourist(_firstName, _lastName, _passportNumber, _nationality);
    }

    function getTourist(address _addr) public view returns (Tourist memory) {
        return tourists[_addr];
    }
}
