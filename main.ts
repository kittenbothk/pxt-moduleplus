// ModulePlus@KittenBotHK

//% color="#76dbb1" weight=10 icon="\uf2ce"
//% groups='["ModulePlus"]'
namespace ModulePlus {
let temp=25
let deltaU=0
let U=0
let U25=0
let K=0
let NTU=0
let x=0

let SerialData: Buffer = null
let SerialString=""
let serialBuf: string[] = []
let UTC=""
let longitude=""
let latitude=""

let DS1307_I2C_ADDR = 104;
let DS1307_REG_SECOND = 0
let DS1307_REG_MINUTE = 1
let DS1307_REG_HOUR = 2
let DS1307_REG_WEEKDAY = 3
let DS1307_REG_DAY = 4
let DS1307_REG_MONTH = 5
let DS1307_REG_YEAR = 6
let DS1307_REG_CTRL = 7
let DS1307_REG_RAM = 8

let read = pins.createBuffer(14)
let _touch = DigitalPin.P16

let avgval = 0
let buffer_arr: number[] = []
let sort_temp = 0
let m=0
let b=0
let point1: number[] = [1, 4.00]
let point2: number[] = [0, 9.18]

    export enum date_reg {
    //% block=year
    year = 6,
    //% block=month
    month = 5,
    //% block=day
    day = 4,
    //% block=weekday
    weekday = 3,
    //% block=hour
    hour = 2,
    //% block=minute
    minute = 1,
    //% block=second
    second = 0
    }

    export enum temppin {
        //% block=P0
        P0 = 0,
        //% block=P1
        P1 = 1,
        //% block=P2
        P2 = 2,
        //% block=pin5
        P5 = 5,
        //% block=pin8
        P8 = 8,
        //% block=pin11
        P11 = 11,
        //% block=pin12
        P12 = 12,
        //% block=pin13
        P13 = 13,
        //% block=pin14
        P14 = 14,
        //% block=pin15
        P15 = 15,
        //% block=pin16
        P16 = 16
        }

    export enum lensState {
        //% block=On
        on=1,
        //% block=Off
        off=0
    }

    export enum phCal {
        //% block=PH4.0
        PH4=4,
        //% block=PH9.18
        PH9=9
    }

    //% blockId=ds18init block="Init Water Temp Pin %pin"
    //% group="Water Temperature Sensor" weight=100
    export function ds18init(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullUp)
    }

    //% shim=DS18B20::Temperature
    export function Temperature(p: number): number {
        return 0
    }

    //% blockId=temp block="Get Water Temperature Pin %p"
    //% group="Water Temperature Sensor" weight=99
    export function water_temp(p: temppin): number {
        temp=Math.round(Temperature(p)/10)
        while(temp>=85) {
            temp=Math.round(Temperature(p)/10)
            basic.pause(100)
            }
        return temp
    }

    //% shim=dstemp::celsius
    export function celsius(pin: DigitalPin) : number {
        return 32.6;
    }

    //% blockId=dstemp block="Get Water Temperature(Resistor) Pin %pin"
    //% group="Resistor Water Temperature Sensor" weight=99
    export function DSTemperature(pin: DigitalPin): number {
        temp=celsius(pin)
        while(temp>=85 || temp<=-300) {
            temp=celsius(pin)
            basic.pause(100)
            }

        return Math.round(temp)
    }

    //% blockId=calibrate block="Calibrate w/ Temp %t, Pin %pin"
    //% group="Turbidity Sensor" weight=98
    export function Calibrate(t: number, pin: AnalogPin) {
        temp = t
        x = pins.analogReadPin(pin)
        deltaU = -0.0192*(temp-25)
        U = x*5/1024
        U25 = U-deltaU
        K = 865.68*U25
    }

    //% blockId=calibrate_notemp block="Calibrate w/o Temp, Pin %pin"
    //% group="Turbidity Sensor" weight=97
    export function Calibrate_notemp(pin: AnalogPin) {
        x = pins.analogReadPin(pin)
        deltaU = -0.0192*(temp-25)
        U = x*5/1024
        U25 = U-deltaU
        K = 865.68*U25
    }
    //% blockId=get_ntu block="Get NTU Pin %pin"
    //% group="Turbidity Sensor" weight=96
    export function get_ntup(pin: AnalogPin):number {
        x = pins.analogReadPin(pin)
        U = x*5/1024
        NTU = (-865.68*U)+K
        if (NTU < 0){
            return 0
        } else {
            return NTU
        }
    }

    //% blockID=lens_set block="Sugar Lens Pin %pin ,Set %state"
    //% group="Sugar Lens FPV" weight=95
    export function lens_set(pin: DigitalPin, state: lensState){
        pins.digitalWritePin(pin,state)
    }

    export enum timeindex{
    //% block="Hour"
    hour=0,
    //% block="Minute"
    min=1,
    //% block="Second"
    sec=2,
    }
    /**
       * init serial port
       * @param tx Tx pin; eg: SerialPin.P1
       * @param rx Rx pin; eg: SerialPin.P2
       */
      //% blockId=gps_init block="GPS init|Tx(Blue) pin %tx|Rx(Green) pin %rx"
      //% group="GPS" weight=100
      export function gps_init(tx: SerialPin, rx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        serial.setRxBufferSize(72)
        basic.pause(100)
      }

      //% blockId=gps_read block="GPS Read Data"
      //% group="GPS" weight=95
      export function gps_read(){
      SerialString=''
      while (!SerialString.includes("GNGGA")){
        SerialData=serial.readBuffer(72)
        for (let i =0; i<=SerialData.length;i++){
          let temp = String.fromCharCode(SerialData[i])
          SerialString = SerialString + temp
        }
        basic.pause(100)
      }
      if (SerialString.includes("GNGGA")){
        serialBuf=SerialString.split(",")
      } else {
        serialBuf=[]
      }

      if (serialBuf.length>=4){
        UTC=serialBuf[1]
        latitude=serialBuf[2]
        longitude=serialBuf[4]
      }
      }

      //% blockId=gps_utc block="GPS get UTC Time %i"
      //% group="GPS" weight=85
      export function gps_utc(i:timeindex): number{
      if (UTC!=''){
      let time=[]
      time[0]=parseFloat(UTC.substr(0,2))
      time[0]=time[0]+8
      time[1]=parseFloat(UTC.substr(2,2))
      time[2]=parseFloat(UTC.substr(4,2))
      return time[i]
      }
      else return 0
      }

      //% blockID=gps_latitude block="GPS Get Latitude"
      //% group="GPS" weight=80
      export function gps_latitude():number{
      let latfinal = -1
      if (latitude!=''){
      latfinal=parseFloat(latitude.substr(0,2))+(parseFloat(latitude.substr(2,latitude.length)))/60
      latfinal= parseFloat((convertToText(latfinal).substr(0,8)))
      }
      return latfinal
      }

      //% blockID=gps_longitude block="GPS Get Longitude"
      //% group="GPS" weight=75
      export function gps_longitude():number{
      let lonfinal = -1
      if (longitude!=''){
      lonfinal=parseFloat(longitude.substr(0,3))+(parseFloat(longitude.substr(3,longitude.length)))/60
      lonfinal= parseFloat((convertToText(lonfinal).substr(0,8)))
      }
      return lonfinal
      }

     /**
     * set ds1307's reg
     */
    function setReg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(DS1307_I2C_ADDR, buf);
    }

    /**
     * get ds1307's reg
     */
    function getReg(reg: number): number {
        pins.i2cWriteNumber(DS1307_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(DS1307_I2C_ADDR, NumberFormat.UInt8BE);
    }

    /**
     * convert a Hex data to Dec
     */
    function HexToDec(dat: number): number {
        return (dat >> 4) * 10 + (dat % 16);
    }

    /**
     * convert a Dec data to Hex
     */
    function DecToHex(dat: number): number {
        return Math.idiv(dat, 10) * 16 + (dat % 10)
    }

    /**
     * start ds1307 (go on)
     */
    //% blockId="DS1307_START" block="start"
    //% group="Clock Module" weight=74
    export function start() {
        let t = getSecond()
        setSecond(t & 0x7f)
    }

    /**
     * stop ds1307 (pause)
     */
    //% blockId="DS1307_STOP" block="pause"
    //% group="Clock Module" weight=73
    export function stop() {
        let t = getSecond()
        setSecond(t | 0x80)
    }

    /**
     * get Second
     */
    function getSecond(): number {
        return Math.min(HexToDec(getReg(DS1307_REG_SECOND)), 59)
    }

    /**
     * set Date and Time
     * @param year is the Year will be set, eg: 2022
     * @param month is the Month will be set, eg: 10
     * @param day is the Day will be set, eg: 15
     * @param weekday is the Weekday will be set, eg: 6
     * @param hour is the Hour will be set, eg: 16
     * @param minute is the Minute will be set, eg: 30
     * @param second is the Second will be set, eg: 0
     */
    //% blockId="DS1307_SET_DATETIME" block="set year %year|month %month|day %day|weekday %weekday|hour %hour|minute %minute|second %second"
    //% group="Clock Module" weight=72
    export function DateTime(year: number, month: number, day: number, weekday: number, hour: number, minute: number, second: number): void {
        let buf = pins.createBuffer(8);
        buf[0] = DS1307_REG_SECOND;
        buf[1] = DecToHex(second % 60);
        buf[2] = DecToHex(minute % 60);
        buf[3] = DecToHex(hour % 24);
        buf[4] = DecToHex(weekday % 8);
        buf[5] = DecToHex(day % 32);
        buf[6] = DecToHex(month % 13);
        buf[7] = DecToHex(year % 100);
        pins.i2cWriteBuffer(DS1307_I2C_ADDR, buf)
    }

    //% blockId="DS1307_GET_DATE" block="date %reg"
    //% group="Clock Module" weight=71
    export function getDate(reg: date_reg): number {
        if (reg == DS1307_REG_YEAR){
        return HexToDec(getReg(reg)) + 2000
        } else {
        return HexToDec(getReg(reg))
        }
    }

    /**
     * set second
     * @param dat is the Second will be set, eg: 0
     */
    function setSecond(dat: number): void {
        setReg(DS1307_REG_SECOND, DecToHex(dat % 60))
    }



    function searchfinger() {
		let cmd_search = pins.createBuffer(12)
		cmd_search[0] = 239
		cmd_search[1] = 1
		cmd_search[2] = 255
		cmd_search[3] = 255
		cmd_search[4] = 255
		cmd_search[5] = 255
		cmd_search[6] = 1
		cmd_search[7] = 0
		cmd_search[8] = 3
		cmd_search[9] = 1
		cmd_search[10] = 0
		cmd_search[11] = 5
		serial.writeBuffer(cmd_search)
		read = serial.readBuffer(12)
		basic.pause(200)
		while (convertToText(read[9]) == "2") {
			let cmd_search = pins.createBuffer(12)
			cmd_search[0] = 239
			cmd_search[1] = 1
			cmd_search[2] = 255
			cmd_search[3] = 255
			cmd_search[4] = 255
			cmd_search[5] = 255
			cmd_search[6] = 1
			cmd_search[7] = 0
			cmd_search[8] = 3
			cmd_search[9] = 1
			cmd_search[10] = 0
			cmd_search[11] = 5
			serial.writeBuffer(cmd_search)
			read = serial.readBuffer(12)
			basic.pause(200)
		}
    }


    //% blockId= init_KittenFinger block="Fingerprint Sensor Init RX(Blue) %txpin TX(Yellow) %rxpin Touch(Green) %touchpin"
    //% group="FingerPrint" weight=70
    export function initKittenFinger(txpin: SerialPin, rxpin: SerialPin, touchpin: DigitalPin): void {
        _touch=touchpin
		serial.redirect(txpin,rxpin,BaudRate.BaudRate57600)
		basic.pause(2000)
		let link = pins.createBuffer(16)
		link[0] = 239
		link[1] = 1
		link[2] = 255
		link[3] = 255
		link[4] = 255
		link[5] = 255
		link[6] = 1
		link[7] = 0
		link[8] = 7
		link[9] = 19
		link[10] = 0
		link[11] = 0
		link[12] = 0
		link[13] = 0
		link[14] = 0
		link[15] = 27
		serial.writeBuffer(link)
		read = serial.readBuffer(12)
		basic.pause(200)
		let readflash = pins.createBuffer(12)
		readflash[0] = 239
		readflash[1] = 1
		readflash[2] = 255
		readflash[3] = 255
		readflash[4] = 255
		readflash[5] = 255
		readflash[6] = 1
		readflash[7] = 0
		readflash[8] = 3
		readflash[9] = 22
		readflash[10] = 0
		readflash[11] = 26
		serial.writeBuffer(readflash)
		read = serial.readBuffer(12)
		basic.pause(200)
		let readmould = pins.createBuffer(12)
		readmould[0] = 239
		readmould[1] = 1
		readmould[2] = 255
		readmould[3] = 255
		readmould[4] = 255
		readmould[5] = 255
		readmould[6] = 1
		readmould[7] = 0
		readmould[8] = 3
		readmould[9] = 29
		readmould[10] = 0
		readmould[11] = 33
		serial.writeBuffer(readmould)
		read = serial.readBuffer(20)
		read = serial.readBuffer(14)
		basic.pause(200)
    }

    //% blockId= Finger_touch block="Finger Touched"
    //% group="FingerPrint" weight=69
    export function fingertouch(): boolean{
        if (pins.digitalReadPin(_touch) == 1){
        return true
        } else {
        return false
        }
    }

    //% blockId= Finger_search block="Get Finger ID"
    //% group="FingerPrint" weight=68
    export function fingersearch(): string {
		searchfinger()
		let cmd_gen1 = pins.createBuffer(13)
		cmd_gen1[0] = 239
		cmd_gen1[1] = 1
		cmd_gen1[2] = 255
		cmd_gen1[3] = 255
		cmd_gen1[4] = 255
		cmd_gen1[5] = 255
		cmd_gen1[6] = 1
		cmd_gen1[7] = 0
		cmd_gen1[8] = 4
		cmd_gen1[9] = 2
		cmd_gen1[10] = 1
		cmd_gen1[11] = 0
		cmd_gen1[12] = 8
		serial.writeBuffer(cmd_gen1)
		read = serial.readBuffer(12)
		basic.pause(200)
		let cmd_dis = pins.createBuffer(17)
		cmd_dis[0] = 239
		cmd_dis[1] = 1
		cmd_dis[2] = 255
		cmd_dis[3] = 255
		cmd_dis[4] = 255
		cmd_dis[5] = 255
		cmd_dis[6] = 1
		cmd_dis[7] = 0
		cmd_dis[8] = 8
		cmd_dis[9] = 4
		cmd_dis[10] = 1
		cmd_dis[11] = 0
		cmd_dis[12] = 0
		cmd_dis[13] = 1
		cmd_dis[14] = 0x2C
		cmd_dis[15] = 0
		cmd_dis[16] = 0x3B
		serial.writeBuffer(cmd_dis)
		read = serial.readBuffer(16)
		basic.pause(200)
		if ((read[13]) > 20){
			basic.pause(200)
			return convertToText(read[11])
		}
		else
			return "No Match"
    }

    //% blockId= Finger_wait block="Wait Finger Release"
    //% group="FingerPrint" weight=67
	export function waitfinger (): void {
		let cmd_search = pins.createBuffer(12)
		cmd_search[0] = 239
		cmd_search[1] = 1
		cmd_search[2] = 255
		cmd_search[3] = 255
		cmd_search[4] = 255
		cmd_search[5] = 255
		cmd_search[6] = 1
		cmd_search[7] = 0
		cmd_search[8] = 3
		cmd_search[9] = 1
		cmd_search[10] = 0
		cmd_search[11] = 5
		serial.writeBuffer(cmd_search)
		read = serial.readBuffer(12)
		basic.pause(200)
		while (convertToText(read[9]) != "2") {
			let cmd_search = pins.createBuffer(12)
			cmd_search[0] = 239
			cmd_search[1] = 1
			cmd_search[2] = 255
			cmd_search[3] = 255
			cmd_search[4] = 255
			cmd_search[5] = 255
			cmd_search[6] = 1
			cmd_search[7] = 0
			cmd_search[8] = 3
			cmd_search[9] = 1
			cmd_search[10] = 0
			cmd_search[11] = 5
			serial.writeBuffer(cmd_search)
			read = serial.readBuffer(12)
			basic.pause(200)
		}
	}

    //% blockId= Finger_save block="Save Finger |ID %value"
    //% group="FingerPrint" weight=66
	export function savefinger (value: number): boolean {
		searchfinger()
		let cmd_gen1 = pins.createBuffer(13)
		cmd_gen1[0] = 239
		cmd_gen1[1] = 1
		cmd_gen1[2] = 255
		cmd_gen1[3] = 255
		cmd_gen1[4] = 255
		cmd_gen1[5] = 255
		cmd_gen1[6] = 1
		cmd_gen1[7] = 0
		cmd_gen1[8] = 4
		cmd_gen1[9] = 2
		cmd_gen1[10] = 1
		cmd_gen1[11] = 0
		cmd_gen1[12] = 8
		serial.writeBuffer(cmd_gen1)
		read = serial.readBuffer(12)
		basic.pause(500)
		searchfinger()
		let cmd_gen2 = pins.createBuffer(13)
		cmd_gen2[0] = 239
		cmd_gen2[1] = 1
		cmd_gen2[2] = 255
		cmd_gen2[3] = 255
		cmd_gen2[4] = 255
		cmd_gen2[5] = 255
		cmd_gen2[6] = 1
		cmd_gen2[7] = 0
		cmd_gen2[8] = 4
		cmd_gen2[9] = 2
		cmd_gen2[10] = 2
		cmd_gen2[11] = 0
		cmd_gen2[12] = 9
		serial.writeBuffer(cmd_gen2)
		read = serial.readBuffer(12)
		basic.pause(200)
		let cmd_reg = pins.createBuffer(12)
		cmd_reg[0] = 239
		cmd_reg[1] = 1
		cmd_reg[2] = 255
		cmd_reg[3] = 255
		cmd_reg[4] = 255
		cmd_reg[5] = 255
		cmd_reg[6] = 1
		cmd_reg[7] = 0
		cmd_reg[8] = 3
		cmd_reg[9] = 5
		cmd_reg[10] = 0
		cmd_reg[11] = 9
		serial.writeBuffer(cmd_reg)
		read = serial.readBuffer(12)
		basic.pause(200)
		let cmd_save = pins.createBuffer(15)
		cmd_save[0] = 239
		cmd_save[1] = 1
		cmd_save[2] = 255
		cmd_save[3] = 255
		cmd_save[4] = 255
		cmd_save[5] = 255
		cmd_save[6] = 1
		cmd_save[7] = 0
		cmd_save[8] = 6
		cmd_save[9] = 6
		cmd_save[10] = 1
		cmd_save[11] = 0
		cmd_save[12] = value
		cmd_save[13] = 0
		cmd_save[14] = cmd_save[12]+14
		serial.writeBuffer(cmd_save)
		read = serial.readBuffer(12)
		basic.pause(200)
		if (convertToText(read[11]) == "10")
			return true
		else
			return false
	}

    //% blockId= Finger_delete block="Delete Finger |ID %value"
    //% group="FingerPrint" weight=65
	export function deletefinger (value: number): boolean {
		let cmd_deletchar = pins.createBuffer(16)
		cmd_deletchar[0] = 239
		cmd_deletchar[1] = 1
		cmd_deletchar[2] = 255
		cmd_deletchar[3] = 255
		cmd_deletchar[4] = 255
		cmd_deletchar[5] = 255
		cmd_deletchar[6] = 1
		cmd_deletchar[7] = 0
		cmd_deletchar[8] = 7
		cmd_deletchar[9] = 0x0c
		cmd_deletchar[10] = 0
		cmd_deletchar[11] = value
		cmd_deletchar[12] = 0
		cmd_deletchar[13] = 1
		cmd_deletchar[14] = 0
		cmd_deletchar[15] = 21+value
		serial.writeBuffer(cmd_deletchar)
		read = serial.readBuffer(12)
		basic.pause(200)
		if (convertToText(read[11]) == "10")
			return true
		else
			return false
    }

    function phSampling(pin:AnalogPin):number {
        //take 10 samples
        for (let index=0;index<10;index++){
            buffer_arr[index] = pins.analogReadPin(pin)
            basic.pause(30)
        }
        // bubble sort
        for (let i=0;i<9;i++){
            for (let j=i+1;j<10;j++){
                if(buffer_arr[i]>buffer_arr[j]){
                sort_temp=buffer_arr[i]
                buffer_arr[i]=buffer_arr[j]
                buffer_arr[j]=sort_temp
                }
            }
        }
        avgval=0
        for (let i=2;i<8;i++){
            avgval+=buffer_arr[i]
        }
        let voltage = avgval*3.3/1024/6
        return voltage
    }

        function slope(){
        // m = y2-y1/x2-x1
        m = (point2[1]-point1[1])/(point2[0]-point1[0])
        // b = -mx+y
        b = (m*point1[0]*-1)+point1[1]
    }

    //% blockId=ph_cali block="Calibrate PH %cali %pin"
    //% group="PH" weight=66
    export function phCalibrate(cali: phCal, pin:AnalogPin){
        if (cali == 4){
            point1[0]=phSampling(pin)
        } else {
            point2[0]=phSampling(pin)
        }
        slope()
    }
    /**
    * Turn potentiometer until sensor returns true
    */
    //% blockId=ph_init block="PH Init @6.86? %pin"
    //% group="PH"
    //% advanced=true
    export function PHinit(pin:AnalogPin):boolean {
        let read = pins.analogReadPin(pin)
        if (read >= 517 && read <= 537){
            return true
        } else {
            return false
        }
    }

    //% blockId=ph_get block="Get PH %pin"
    //% group="PH" weight=67
    export function getPH(pin:AnalogPin):number {
        let voltage = phSampling(pin)
        let ph_act= m*voltage+b
        return ph_act
    }
}
